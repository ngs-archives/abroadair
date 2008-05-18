Recruit.UI.key = 'ef4393b09d77dbc2';
var ABROADWidget = {
	results : false,
	templates : {},
	elements : {},
	update : null,
	version : "1.0.1",
	init : function() {
		var gv = function(i) { return ABROADWidget.pref.get(i); }
		var pd = {};
		$.each(["Dept","Month","Order"],function(){
			var i = this.toLowerCase();
			if(i=="month") i="ym";
			pd[i] = new ABROAD.UI[this].Pulldown({ val:gv(i) });
		});
		$.each(["Term","Price"],function(){
			var i = this.toLowerCase();
			pd[i] = new ABROAD.UI[this].Pulldown({
				min : { val:gv(i+"_min") },
				max : { val:gv(i+"_max") }
			});
		});
		$("form#search-form input[@name='order']").val(gv("order"));
		$("form#search-form input[@type='text']").click(function(){ this.select(); });
		$("#ab-order-sel").change(function(e){ ABROADWidget.changeSort($(this).val()); });
		$("#ab-order-sel").selectbox({});
		
		//
		$("a[@href='http://www.ab-road.net/']").append(this.getBeacon());
		$("a[@href='http://www.ab-road.net/']").attr("href",this.vcURL("http:\/\/www.ab-road.net\/"));
		var ou = function() {
			$("#ab-area-sel,#ab-country-sel,#ab-city-sel").each(function(){
				this.disabled = this.options.length<=1;
			});
		}
		pd.places = new ABROAD.UI.Places.Pulldown({
			area : { val:gv("area"), first_opt_text:getLocalizedString("select_area"), on_update_hook:ou },
			country : { val:gv("country"), first_opt_text:getLocalizedString("select_country"), on_update_hook:ou },
			city : { val:gv("city"), first_opt_text:getLocalizedString("select_city"), on_update_hook:ou }
		});
		$("#ab-area-sel,#ab-country-sel,#ab-city-sel").change(ou);
		this.elements.pulldown = pd;
		$("form#search-form input").each(function(){
			$(this).val(ABROADWidget.pref.get($(this).attr("name")));
		});
		this.elements.searchform = { input : $("form#search-form select,form#search-form input[@type='text']") };
		this.elements.searchform.input.change(function(){
			ABROADWidget.pref.remember();
		});
		$("a[@rel='submit']").click(function(){ $("form#"+$(this).attr("href").split("#").pop()).trigger("submit"); return false; });
		$("a[@rel='reset']").click(function(){
			var fm = $("form#"+$(this).attr("href").split("#").pop());
			fm.each(function(){ this.reset(); });
			$("select",fm).val("");
			setTimeout(function(){
				$("select",fm).trigger("change");
				ABROADWidget.pref.remember();
			},99);
			return false;
		});
		$("a[@rel='external']").click(function(){ return ABROADWidget.getURL($(this).attr("href")); });
		$("a[@rel='set-status']").click(function(){ ABROADWidget.setStatus($(this).attr("href").split("#").pop()); return false; });
		$("a[@rel='close']").click(function(){ window.nativeWindow.close(); return false; });
		$("a[@rel='minimize']").click(function(){ window.nativeWindow.minimize(); return false; });
		$("form#search-form").submit(function(){
			if(ABROADWidget._status=="search") ABROADWidget.search();
			else ABROADWidget.setStatus("search");
			return false;
		});
		$("div#error").click(function(){ ABROADWidget.setStatus("search"); });
		$("body").addClass("browser");
		if(window.nativeWindow) {
			$("#navi-top").mousedown(function(){
				$("body").one("mouseup",function(){
					var w = window.nativeWindow;
					ABROADWidget.editor.write("window.txt",[w.x,w.y,w.width,w.height].join(","));
				});
				window.nativeWindow.startMove();
			});
		}
		//
		$("div#page-navi p.current span.c").html("<#cp>");
		$("div#page-navi p.current span.t").html("<#lp>");
		this.templates.page = $("div#page-navi").html().replace(/\t|\n/g,"").replace(/&gt;/g,">").replace(/&lt;/g,"<");
		this.templates.cassette = $("#cassette-template").html().replace(/\t|\n/g,"");
		$("#cassette-template").remove();
		$("div#page-navi").empty();
		$.getJSON("http://widgets.ngsdev.org/info/abroad-air.js",function(d){
			ABROADWidget.update = d;
			if(d&&ABROADWidget.checkUpdate()) return ABROADWidget.confirmUpdate();
			else return ABROADWidget.setStatus("search");
		});
	},
	checkUpdate : function() {
		var cversion = this.version.split(".").join("");
		if(cversion.length<=2) cversion = cversion+"0";
		cversion = parseInt(cversion);
		var uversion = this.update&&this.update.version?this.update.version.split(".").join(""):"";
		if(uversion.length<=2) uversion = uversion+"0";
		uversion = parseInt(uversion);
		return uversion>cversion;
	},
	confirmUpdate : function(){
		this.confirm(getLocalizedString("confirm_update"),function(){
			ABROADWidget.getURL(ABROADWidget.update.download);
			ABROADWidget.setStatus("search");
		});
	},
	confirm : function(msg,callback_yes,callback_no) {
		callback_yes = callback_yes ? callback_yes : function() { return false; }
		callback_no = callback_no ? callback_no : function() { ABROADWidget.setStatus("search"); return false; }
		$("#confirm ul.buttons li a").unbind("click");
		$("#confirm ul.buttons li.yes a").click(callback_yes);
		$("#confirm ul.buttons li.no a").click(callback_no);
		msg = msg ? msg : "";
		$("div#confirm p.message").html("<em>"+msg+"<\/em>");
		this.setStatus("confirm");
		return false;
	},
	error : function(msg) {
		msg = msg ?msg: getLocalizedString("error_unknown");
		$("div#error p.message").html("<em>"+msg+"<\/em>");
		this.setStatus("error");
		return false;
	},
	search : function(start) {
		start = start ? start : 1;
		var url = "http:\/\/webservice.recruit.co.jp\/ab-road\/tour\/v1\/?" + 
		"key=" + Recruit.UI.key + "&format="+(air?"json":"jsonp&callback=?")+"&" +
		"start=" + start + "&" + $( 'form#search-form' ).formSerialize()+
		"&rnd="+Math.ceil(Math.random()*10000000).toString();
		delete this.results;
		$.getJSON(url,function(d){
			ABROADWidget.onLoadResults(d);
		});
		this.setStatus("loading");
	},
	setStatus : function(i) {
		var bool = false, reverse = false;
		if(i=="back"&&!$("body.back").size()) reverse = "ToBack";
		else if(i!="back"&&$("body.back").size()) {
			reverse = "ToFront";
			i = this._status;
		}
		$.each(["complete","confirm","error","loading","search","back"],function(){
			if(this!=i) $("body").removeClass(this);
			else {
				$("body").addClass(this);
				bool = true;
			}
		}) ;
		switch(i) {
			case "loading":
			case "error":
			case "confirm":
				$("div#"+i).css("opacity","0.0");
				$("div#"+i).animate({opacity:1},"fast");
				$("p#info-button").addClass("hidden");
				break;
			case "search":
				$("div#results").addClass("hidden");
				$("div#search").removeClass("hidden");
				$("p#info-button").removeClass("hidden");
				break;
			case "complete":
				$("div#results").removeClass("hidden");
				$("div#search").addClass("hidden");
				$("p#info-button").removeClass("hidden");
				break;
				
		}
		if(bool&&i!="back") this._status = i;
		return bool;
	},
	onLoadResults : function(d) {
		var r = d.results;
		this.results = r;
		if(!d||!r||r.error) return this.error(r&&r.error&&r.error[0]&&r.error[0].message);
		else if(!this.appendCassettes(r.tour)) return false;
		//
		var page = new Recruit.UI.Page.Simple(d);
		$("div#navi-top p.hitnum em").html(page.data_page._total_entries);
		page.paginate({
			id : "page-navi",
			request: function(i) { ABROADWidget.search(i); },
			template : this.templates.page
		});
		$("div#results").addClass("hidden");
		setTimeout(function(){
			$("div#results").removeClass("hidden");
			ABROADWidget.setStatus("complete");
			if($("div#cassettes").height()>$("div#results").height())
				$("div#results").addClass("overflow");
			else
				$("div#results").removeClass("overflow");
		},99);
		return true;
	},
	appendCassettes : function(tours) {
		if(!tours||!tours.length) return this.error(getLocalizedString("error_noresult"));
		var ht = "";
		var tmpl = this.templates.cassette;
		var d_month = $("div#search select[@name='ym']").val()
		d_month = d_month&&d_month.length==6?parseInt(d_month.substr(-2)):"";
		function fmturi(s,d) {
			var q = s.split("?").pop().split("&"), p = "", o = {};
			$.each(q,function(){
				var a = this.split("=");
				o[a[0]] = a[1];
				if(!a[0].match(/tourcode|vos|site_code|root_type/))	p+=a[0]+"-"+a[1]+"\/";
			});
			if(!o.d_month&&d_month) p += "d_month-"+d_month+"\/";
			switch(d) {
				case "NRT": case "HND": case "TYO": d = "TYO"; break;
				case "OSA": case "ITM": case "KIX": d = "OSA"; break;
				case "NGO": d = "NGO"; break;
				default : d = "999"; break;
			}
			return ABROADWidget.vcURL("http:\/\/www.ab-road.net\/tour\/detail\/"+d+"\/"+o.tourcode+"\/s01rWG\/"+p+"?vos=nabrvccp07110201");
		}
		function fmtnum(x) {
			var s = "" + x;
			var p = s.indexOf(".");
			if (p < 0) p = s.length;
			var r = s.substring(p, s.length);
			for (var i = 0; i < p; i++) {
				var c = s.substring(p - 1 - i, p - 1 - i + 1);
				if (c < "0" || c > "9") { r = s.substring(0, p - i) + r; break; }
				if (i > 0 && i % 3 == 0) r = "," + r;
				r = c + r;
			}
			return r;
		}
		$("div#content div#cassettes").remove();
		var cassettes = $("<div id=\"cassettes\"><\/div>")
		$.each(tours,function(){
			var l = fmturi(this.urls.pc,this.dept_city.code);
			var t = "<div class=\"cassette\">"+tmpl+"<\/div>";
			t = t.replace(/__title__/g,this.title);
			t = t.replace(/__term__/g,this.term);
			t = t.replace(/__price_min__/g,fmtnum(this.price.min/10000));
			t = t.replace(/__price_max__/g,fmtnum(this.price.max/10000));
			t = t.replace(/__city_summary__/g,this.city_summary);
			t = t.replace(/#cassette-template/,l);
			var cas = $(t);
			if(this.price.min==this.price.max) $("p.price span.min,p.price span.glue",cas).remove();
			$("a",cas).append(ABROADWidget.getBeacon());
			cassettes.append(cas);
		});
		cassettes.append("<div class=\"dummy\"><\/div>");
		$("div#content").append(cassettes);
		$("div#cassettes div.cassette").click(function(){
			return ABROADWidget.getURL($("h2 a",this).attr("href"));
		});
		return true;
	},
	getURL : function(h) {
		if (air&&air.navigateToURL) {
			air.navigateToURL(new air.URLRequest(h),"_blank");
		} else window.open(h);
		return false;
	},
	changeSort : function(h) {
		var ipt = $("form#search-form input[@name='order']");
		if(ipt.val()==h) return false;
		ipt.val(h);
		this.pref.set("order",h);
		this.search();
		return false;
	},
	pref : {
		set : function(k,v,nosave) {
			this._obj = this._obj ? this._obj : {};
			this._obj[k] = v;
			if(!nosave) this.save();
		},
		get : function(k) {
			this._obj = this._obj ? this._obj : this.load();
			return this._obj[k] ? this._obj[k] : "";
		},
		save : function() {
			var xml = "<data>"
			$.each(this._obj,function(i){
				xml += "<"+i+">"+this+"<\/"+i+">";
			});
			xml += "<\/data>";
			ABROADWidget.editor.write("plist.xml",xml);
		},
		load : function() {
			var sobj = {};
			var xml = ABROADWidget.editor.read("plist.xml");
			if(!xml) return {};
			xml = $(xml);
			$("*",xml).each(function(){
				sobj[this.tagName.toLowerCase()] = $(this).text();
			});
			return sobj;
		},
		remember : function() {
			var ipt = ABROADWidget.elements.searchform.input;
			setTimeout(function(){
				ipt.each(function(){
					var k = $(this).attr("name");
					if(k) ABROADWidget.pref.set(k,$(this).val(),true);
				})
				ABROADWidget.pref.save();
			},99);
		},
		_obj : null
	},
	editor : {
		write : function(fname,strd) {
			if(!air) return;
			var file = air.File.applicationStorageDirectory.resolvePath(fname);
			var stream = new air.FileStream();
			stream.open(file, air.FileMode.WRITE);
			stream.writeMultiByte(strd, air.File.systemCharset);
			stream.close();
		},
		read : function(fname) {
			if(!air) return "";
			var file = air.File.applicationStorageDirectory.resolvePath(fname);
			if(!file.exists) return "";
			var stream = new air.FileStream();
			stream.open(file, air.FileMode.READ);
			var data = stream.readMultiByte(stream.bytesAvailable, air.File.systemCharset);
			stream.close();
			return data;
		}
	},
	getBeacon : function() {
		return "<img src=\"http:\/\/ad.jp.ap.valuecommerce.com\/servlet\/gifbanner?sid=2462325&pid=876800001\" class=\"beacon\" style=\"position:absolute; top:-9999px; left:-9999px;\" \/>";
	},
	vcURL : function(u) {
		return "http://ck.jp.ap.valuecommerce.com/servlet/referral?sid=2462325&pid=876800001&vc_url="+encodeURIComponent(u);
	}
}

$(document).ready(function(){
	ABROADWidget.init();
});

var pos = ABROADWidget.editor.read("window.txt");
if(pos) {
	pos = pos.split(",");
	$.each(pos,function(i){ pos[i] = parseInt(this); });
	window.nativeWindow.bounds = new air.Rectangle(pos[0],pos[1]);
	//,pos[2],pos[3] window size fix
}