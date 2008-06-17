<?php
	ini_set("include_path","./lib/");
	require_once("Recruit/API.php");
	require_once("Recruit/ABRoad.php");
	require_once("Flickr/API.php");
	define("Flickr_APIKey","a7ebd7750c683aa033ff6ec044687adf");
	define("Recruit_APIKey","ef4393b09d77dbc2");
	$abroad_api = new Recruit_ABRoad(array("key"=>Recruit_APIKey));
	$flickr_api = new Flickr_API(array("api_key"=>Flickr_APIKey));
	
	$tours = $abroad_api->getTourList(array(
		"area" => "EUR",
		"country" => "GB",
		"count" => "10"
	));
	foreach($tours as $n=>$tour) {
		$p = array("accuracy"=>"3");
		$i = rand(0,count($tour{"sche"})-2);
		$p{"lat"} = $tour{"sche"}[$i]{"city"}{"lat"};
		$p{"lon"} = $tour{"sche"}[$i]{"city"}{"lng"};
		$loc = $flickr_api->callMethod("flickr.places.findByLatLon",$p);
		$place_id = $loc ? $loc->children[0]->children[0]->attributes{"place_id"} : "";
		$p = array(
			"place_id" => $place_id,
			"accuracy" => "3",
			"text" => "trip",
			"per_page" => "20"
		);
		$photos = $flickr_api->callMethod("flickr.photos.search",$p);
		$photos = $photos->children[0]->children;
		$photo = $photos[rand(0,count($photos)-1)];
		$atr = $photo->attributes;
		$img = "http://farm".$atr{'farm'}.".static.flickr.com/".$atr{'server'}."/".$atr{'id'}."_".$atr{'secret'}."_t.jpg";
		$tours[$n]{"photo"} = $img;
	}
	print_r($tours);
	

?>