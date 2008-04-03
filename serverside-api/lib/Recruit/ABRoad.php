<?php
	/*
	 * [ Recruit ABRoad module ]
	 * 
	 *  @author    : atsushi nagase : ngsdev.org
	 *  @reference : http://webservice.recruit.co.jp/ab-road/
	 * 
	 */

	require_once 'Recruit/API.php';

	class Recruit_ABRoad extends Recruit_API {
		
		function Recruit_ABRoad($params=array()) {
			foreach($params as $k => $v){
				$this->_cfg[$k] = $v;
			}
			$this->_cfg{'endpoint'} = "http://webservice.recruit.co.jp/ab-road/";
		}
		
		function getTourList($params=array()) {
			return $this->treeToArray($this->request("tour",$params),array("tour","sche","kodawari"));
		}

		function getAreaMaster($params=array()) {
			return $this->getMaster("area", $params);
		}

		function getCountryMaster($params=array()) {
			return $this->getMaster("country", $params);
		}

		function getCityMaster($params=array()) {
			return $this->getMaster("city", $params);
		}

		function getHotelMaster($params=array()) {
			return $this->getMaster("hotel", $params);
		}

		function getAilineMaster($params=array()) {
			return $this->getMaster("airline", $params);
		}

		function getKodawariMaster($params=array()) {
			return $this->getMaster("kodawari", $params);
		}

		function getSpotMaster($params=array()) {
			return $this->getMaster("spot", $params);
		}

		function getTourTallyMaster($params=array()) {
			return $this->getMaster("tour_tally", $params);
		}
		
	}
?>