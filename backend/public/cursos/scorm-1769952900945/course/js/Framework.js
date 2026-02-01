function Framework(mode){
	Framework.mode = mode;
	Framework.Lesson_location = "";
	Framework.PageVisitedStatus = new Array();
	Framework.completion = "incomplete";
	Framework.currentIndex = 0;
	Framework.protocol = window.location.href.indexOf("https") != -1 ? "https" : "http";
	//this.includeFiles(mode.toLowerCase());
	//Utils.loadXML("xml/module.xml", this.parseXML);
	this.includeFiles(mode);
}

Framework.prototype.includeFiles = function(mode){
	if(mode == "scorm"){		// scorm supporting files are loaded here
		
		$.getScript("js/scorm/APIWrapper12.js", function() {
			$.getScript("js/scorm/Scorm12.js", function() {
													  	
				doLMSInitialize();
			});
		});
		
	}else if(mode == "scorm13"){		// scorm supporting files are loaded here
		
		$.getScript("js/scorm/APIWrapper13.js", function() {
			$.getScript("js/scorm/Scorm13.js", function() {
													  	
				doLMSInitialize();
			});
		});
		
	}else if(mode == "tincan"){	
		
		$.getScript("js/tincan/Tincan.js", function() {
			$.getScript("js/tincan/uuid.js", function() {
													  	
				Tincan.initialize();
			});
		});
	
	}else{
		$.getScript("js/lib/cookie.js", function() {
			$.getScript("js/web/Web.js", function() {
				
				var file = bridgeURL +'?id=prabaharan.sachin@gmail.com&name=prabaharan.sachin@gmail.com&course=' + courseId + '&reseller=' + resellerName;
				$.getJSON(file, function(data) {
					console.log(data);		
					//alert(data.result.code);
					if(data.result.code == "1"){
						var obj = {'Lesson_location' : '', 'PageVisitedStatus' : ''};
						data.result.structure.interfaceText = data.result.interfaceText;
						Navigation.loaStructure(data.result.structure, obj = Web.get());
						
					}else{
						$('#info').html(data.result.message+', please contact <a href="mailto:sales@bigger-brains.com"> sales@bigger-brains.com</a>');
						$('#reseller_popup').show();
					}
					
				});
				
			});
		});
	}
}

Framework.prototype.parseXML = function(xml){
	
	this.courseArray = new Array();
	var course = $(xml).find("course");
	document.title = $(course).attr("title");
	$('#title').html($(course).attr("title"));
	Framework.courseName = $(course).attr("title");
	Framework.courseId = $(course).attr("id");
	
	var str = "<ul>";
	
	$($(xml).find("page")).each(function(i){
		Framework.PageVisitedStatus[i] = 0;
		var obj = new Object();
		obj.id = i;
		obj.displayText = $(this).attr('displayText');
		obj.link = $(this).attr('link');
		obj.keywords = $(this).attr('keywords');
		obj.cc = $(this).attr('cc');
		courseArray.push(obj);	
		var moduleTitle = $(this).attr('displayText').substr(0, $(this).attr('displayText').indexOf(':'));
		var text = $(this).attr('displayText').substr($(this).attr('displayText').indexOf(':')+1, $(this).attr('displayText').length);
		str += "<li id='"+i+"' class='link' tooltip='" + $(this).attr('tooltip')+"' url='" + $(this).attr('link') + "' cc='" + $(this).attr('cc') + "' alt='"+ $(this).attr('displayText') +"'><b>" + moduleTitle + "</b><br/>" + text + "</li>";
	})
	str += "</ul>";
	
	View.updateElements("coursemap",str);
	
	var transcript = $(xml).find("transcript");
	
	if($(transcript).attr("available") == "1"){
		if($(document).width() > 800){
			$('#transcriptContainer, #transcriptToggle').show();
		}
	}else{
		$('#transcriptContainer, #transcriptToggle').hide();
		$("#player").css('width', '97%');
	}
	
	var languages = '';
	$($(xml).find("lang")).each(function(i){
		if(i == 0){
			Navigation.ccLanguage = $(this).attr('lang');
			languages += '<div lang="' + $(this).attr('lang') + '"class="flag active"><div class="flagIcon active" style="background-image:url(images/'+ $(this).attr('image')+')"></div><span class="lang">' + $(this).attr('name') + '</span></div>';
		}else{
			languages += '<div lang="' + $(this).attr('lang') + '"class="flag"><div class="flagIcon" style="background-image:url(images/'+ $(this).attr('image')+')"></div><span class="lang">' + $(this).attr('name') + '</span></div>';
		}
		
	});
	View.updateElements("language",languages);
	
	$('.flag').click(function(){
		$('.flag').removeClass('active');
		$(this).addClass('active');
		Navigation.ccLanguage = $(this).attr('lang');
		Navigation.transcript();	
	});
	
	
	$(".link").click(function(){
		if($('#coursemapContainer').is(":visible")){
			$('#coursemapContainer').slideToggle();
		}
		Navigation.loadPages($(this));
	});
	$('#container').show();
	//Navigation.navigation();
}



