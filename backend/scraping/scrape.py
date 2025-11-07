import requests
from bs4 import BeautifulSoup, Tag
import re
from pyproj import Transformer
import time
import json5
import os
import json
from urllib.parse import urljoin


# GLOBAL VARIABLES
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; StockholmProjectScraper)"}
BASE_URL = "https://vaxer.stockholm"
URL = f"{BASE_URL}/projekt/"
TIDPLAN_RE = re.compile(r"\b(?:tids?\s*plan|planerad\s+tids?\s*plan)\b", re.IGNORECASE)
T = Transformer.from_crs("EPSG:3011", "EPSG:4326", always_xy=True)
TOT_NUM_PROJ = 0

def scrape_all_projects():
	# fetch html
	resp = requests.get(URL, headers=HEADERS)
	resp.raise_for_status()
	soup = BeautifulSoup(resp.text, "html.parser")

	# find the script containing smap.init() / map on https://vaxer.stockholm/projekt/ page
	script_tag = None
	for script in soup.find_all("script"):
		if script.string and "smap.init" in script.string:
			script_tag = script.string
			break
	
	if not script_tag:
		raise ValueError("Could not find smap.init script")
	
	# locate geojson section inside script
	geo_start = script_tag.find('"geojson"')
	if geo_start == -1:
		raise ValueError("No 'geojson' key found in script")
	
	# Find first '{' after "geojson"
	brace_start = script_tag.find("{", geo_start)
	if brace_start == -1:
		raise ValueError("No opening brace found after 'geojson'")

	# Match braces to find the end of the object
	brace_count = 0
	end_index = None
	for i in range(brace_start, len(script_tag)):
		if script_tag[i] == "{":
			brace_count += 1
		elif script_tag[i] == "}":
			brace_count -= 1
			if brace_count == 0:
				end_index = i
				break
	
	if end_index is None:
		raise ValueError("Could not find closing brace for geojson")
	
	geojson_str = script_tag[brace_start:end_index + 1]

	# Parse GeoJSON
	geojson = json5.loads(geojson_str)

	# Extract Projects
	invalid_projects = 0
	projects = []
	for feature in geojson.get("features", []):
		props = feature.get("properties", {})
		geom = feature.get("geometry", {})
		
		name = props.get("name")
		url = props.get("url")

		if not name or not url:
			invalid_projects += 1
			continue
		
		projects.append({
        "name": name,
        "widget_text": props.get("content"),
        "url": BASE_URL + url,
        "coordinates": geom.get("coordinates"),
    })
	TOT_NUM_PROJ = len(projects)
	print(f"✅ Extracted {TOT_NUM_PROJ} projects total.")
	print(f"❌ Invalid projects: {invalid_projects}")
	
	return projects



def scrape_project_details(project_url):
	"""Scrape detailed info from a single Växer Stockholm project page."""
	resp = requests.get(project_url, headers=HEADERS)
	resp.raise_for_status()
	soup = BeautifulSoup(resp.text, "html.parser")

	data = {}

	# extract project stages and current stage
	stages_ul = soup.find("ul", class_="project-stages-list")
	stages, current_stage = [], None

	if not stages_ul:
	# Sometimes wrapped deeper inside divs
		stages_ul = soup.select_one("ul.project-stages-list")		

	if stages_ul:
		for li in stages_ul.find_all("li", class_=re.compile("project-stages-list__item")):
			text = li.get_text(strip=True)
			stages.append(text)
			classes = li.get("class", [])
			if any("highlighted" in c for c in classes):
				current_stage = text
	
	data["stages"] = stages
	data["current_stage"] = current_stage

	# extract location
	location_tag = soup.find("h2", class_="subheading")
	data['location'] = location_tag.get_text(strip=True) if location_tag else None

	# extract preamble paragraph
	preamble_tag = soup.find("p", class_="preamble")
	data["preamble"] = preamble_tag.get_text(strip=True) if preamble_tag else None

	def extract_tidplan_html(soup: BeautifulSoup) -> str | None:
		target_h2 = None
		for h2 in soup.find_all("h2"):
			text = " ".join(h2.stripped_strings)
			if TIDPLAN_RE.search(text):
				target_h2 = h2
				break
		if target_h2 is None:
			return None

		article = target_h2.find_parent("article")  # don't over-constrain class names
		container = article if article else target_h2.parent

		parts = [str(target_h2)]
		for sib in target_h2.next_siblings:
			if isinstance(sib, Tag):
				if sib.name == "h2":
					break
				# stop if we somehow left the intended container
				if article and sib.find_parent("article") != article:
					break
				parts.append(str(sib))
			else:
				# include text nodes too
				parts.append(str(sib))

		html = "".join(parts).strip()
		return html if html else None
	
	data['tidplan_html'] = extract_tidplan_html(soup)


	def extract_second_picture_img_url(soup, base_url):
		pictures = soup.find_all("picture")
		if len(pictures) < 2:
			return None  # fewer than 2 pictures

		# get the second <picture>
		second_picture = pictures[1]

		# find first <img> that has an src attribute
		img = second_picture.find("img", src=True)
		if not img or not img.get("src"):
			return None

		# make absolute URL
		return urljoin(base_url, img["src"])
	
	data['image_url'] = extract_second_picture_img_url(soup, BASE_URL)
	
	return data



def convert_SWEREF_to_WGS84(coords):
	x, y = coords
	longitude, latitude = T.transform(x, y)
	return {"latitude":latitude, "longitude":longitude}


def projects_to_json(projects):
	output_dir = os.path.join(os.path.dirname(__file__), "..", "data_scraped")
	os.makedirs(output_dir, exist_ok=True)
	output_path = os.path.join(output_dir, "projects.json")

	with open(output_path, "w", encoding="utf-8") as f:
		json.dump(projects, f, ensure_ascii=False, indent=4)

	print(f"✅ Saved projects to {output_path}")




if __name__ == "__main__":
	projects = scrape_all_projects()
	
	i = 1
	for proj in projects:
		proj['coordinates'] = convert_SWEREF_to_WGS84(proj['coordinates'])
		if proj['url'] is None:
			print(proj)
		
		proj.update(scrape_project_details(proj['url']))
		print(f"Fetched {i}/{len(projects)} projects, Image URL for Project: {proj['image_url']}")
		i += 1
		time.sleep(0.5)

	projects_to_json(projects)
