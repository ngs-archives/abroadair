<?php
	/*
	 * [ Recruit API ]
	 * 
	 *  @author    : atsushi nagase : ngsdev.org
	 *  @reference : http://webservice.recruit.co.jp/
	 * 
	 */

	require_once "XML/Tree.php";
	require_once "HTTP/Request.php";

	class Recruit_API {
	
		var $_cfg = array(
			"key" => "sample",
			"endpoint" => "",
			"version" => "v1",
			"encode" => NULL
		);
			
		var $_page = array();
		var $_err_code = NULL;

		function Recruit_API($params=array()) {
			foreach($params as $k => $v){
				$this->_cfg[$k] = $v;
			}
		}
		
		function getMaster($name,$params=array("count"=>100)) {
			@$params{"count"} = $params{"count"} ? $params{"count"} : 100;
			return $this->treeToArray($this->request($name,$params),$name);
		}
		
		function treeToArray($tree,$nname=NULL) {
			$ar = array();
			if(!$tree||count($tree->children)==0) return $ar;
			foreach($tree->children as $node) {
				if($node->name==$nname || (is_array($nname)&&in_array($node->name,$nname)) || $nname == NULL) $ar[] = $this->treeToObj($node,$nname);
				else if(
					$node->name=="results_available" || 
					$node->name=="results_returned" || 
					$node->name=="results_start"
				) $this->_page{$node->name} = $this->__encode__($node->content);
			}
			return $ar;
		}
		
		function treeToObj($tree,$fary=NULL) {
			$ar = array();
			foreach($tree->children as $node) {
				$v = count($node->children)>0 ? $this->treeToObj($node): $this->__encode__($node->content);
				if($node->name==$fary || (is_array($fary)&&in_array($node->name,$fary))) {
					$ar[$node->name][] = $v;
				} else {
					$ar[$node->name] = $v;
				}
				
			}
			return $ar;
		}
		
		function request($url,$params) {
			$this->_err_code = 0;
			$this->_err_msg = "";
			$this->_page{'count'} = $params{'count'}; 
			$strparam = "key=".$this->_cfg{"key"}."&";
			foreach($params as $k => $v){
				$cur = urlencode($k)."=".urlencode($v)."&";
				if(function_exists("mb_convert_encoding")) $cur = mb_convert_encoding($cur, "UTF-8", "auto");
				$strparam .= $cur;
			}
			$url2 = $this->_cfg["endpoint"].$url."/".$this->_cfg["version"]."/?".$strparam;
			$req =& new HTTP_Request($url2);
			$req->sendRequest();

			$this->_http_code = $req->getResponseCode();
			$this->_http_head = $req->getResponseHeader();
			$this->_http_body = $req->getResponseBody();
			
			if ($this->_http_code != 200){
				$this->_err_code = 0;
				$this->_err_msg = $this->_http_code ? "Bad response from remote server: HTTP status code $this->_http_code" : "Couldn't connect to remote server";
				return 0;
			}
			
			$tree =& new XML_Tree();
			$tree->getTreeFromString($this->_http_body);

			$this->tree = $tree;
		
			if ($tree->root->name != "results"){
				$this->_err_code = 0;
				$this->_err_msg = "Bad XML response";
				return 0;
			}
			
			foreach($tree->root->children as $node) {
				if($node->name=="error") {
					$this->_err_msg = $this->__encode__($node->children[0]->content);
					return 0;
				}
			}
			
			return $tree->root;
			
		}

		function getErrorCode(){
			return $this->_err_code;
		}
		
		function getPageNavi() {
			$total = $this->_page{'results_available'};
			$count = $this->_page{'count'};
			$start = $this->_page{'results_start'};
			$prev = $start > $count	? ( $start - $count ) : ( $start > 1 ? 1 : NULL );
			$next = $total >= $start + $count ? ( $start + $count ) : NULL;
			
			$prevnum = $count;
			$nextnum = $start + $count * 2 > $total ? ($total-($start + $count)) + 1 : $count;
			
			$current = ceil($start/$count);
			$totalpages = ceil($total/$count);

			return array(
				"total" => $total,
				"count" => $count,
				"start" => $start,
				"prev" => $prev,
				"next" => $next,
				"prevnum" => $prevnum,
				"nextnum" => $nextnum,
				"totalpages" => $totalpages,
				"current" => $current
			);
		}
		
		function __encode__($str=NULL) {
			$enc = $this->_cfg{'encode'};
			if($enc || $enc = ini_get("default_charset")) {
				$enc = strtoupper($enc);
				if(($enc)=="SHIFT_JIS") $enc = "SJIS";
				$str = mb_convert_encoding($str, $enc, "UTF-8");
			}
			return $str;
		}
	}


?>