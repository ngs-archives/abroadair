<?php
	ini_set("include_path","../lib/");
	require_once("Recruit/ABRoad.php");
	require_once("Flickr/API.php");
	define("Flickr_APIKey","a7ebd7750c683aa033ff6ec044687adf");
	define("Recruit_APIKey","ef4393b09d77dbc2");
	$abroad_api = new Recruit_ABRoad(array("key"=>Recruit_APIKey));
	$flickr_api = new Flickr_API(array("api_key"=>Flickr_APIKey));
	
	
	
?>