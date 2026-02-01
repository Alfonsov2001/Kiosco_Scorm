var Navigation = {
	ccLanguage: '',
	loadPages:function(link){
		clearInterval(Navigation.interval);
		var url = $(link).attr('url');
		
		var videoNum = url.split('/')[3];
		var videoId = 'vzvd-' + videoNum;
		Framework.videoId = videoId;
		
		$('.transcriptTitle').html($(link).text());
		var h = $('#player').height();
		var id = $(link).attr('id');

		Framework.PageVisitedStatus[id] = 1;
		Framework.currentIndex = id;
		
		var htmlContent = '<iframe allowFullScreen allowTransparency="true" class="vzaar-video-player" frameborder="0" id="'+ videoId +'" mozallowfullscreen name="'+ videoId +'" src="'+ url + '?apiOn=true" title="vzaar video player" type="text/html" webkitAllowFullScreen width="100%" height="' + h + '"></iframe>';
		
		View.updateElements("player",htmlContent);
		
		if( $(link).attr('type') == 'video') {
			if(Framework.ccAvailable) {
				$('#transcriptContainer, #transcriptToggle').show();
				$("#player").css('width', '70%');
				Navigation.transcript(videoId);
			}
			$(link).addClass('completed');
		} else if($(link).attr('type') == 'gkc') {
			url = Framework.gkcPath + url;
			if($('#transcriptContainer').is(":visible")){
				$('#transcriptContainer, #transcriptToggle').hide();
				$("#player").css('width', '97%');
			}
		} else {
			if($('#transcriptContainer').is(":visible")){
				$('#transcriptContainer, #transcriptToggle').hide();
				$("#player").css('width', '97%');
			}
		}

		$('#pageno').html((parseInt(id) + 1)+" of "+ Framework.courseArray.length);
		
		var percentage = ((Utils.getCount(Framework.PageVisitedStatus, 1))/Framework.courseArray.length)*$('#progress').width();
		$('#fill').width(percentage);
		var percentageText = ((Utils.getCount(Framework.PageVisitedStatus, 1))/Framework.courseArray.length)*100;
		$('#progressTxt').text(Math.ceil(percentageText) +"%");
		
		$(link).addClass('completed');
		
		
		
		if(id == 0){
			$('#back').addClass('disable').removeClass('enable');
		}else{
			$('#back').removeClass('disable').addClass('enable');
		} 
		
		if(Framework.courseArray.length-1 == Framework.currentIndex){
			lastPage = true;
			$('#next').addClass('disable').removeClass('enable');
		}else{
			lastPage = false;
			$('#next').removeClass('disable').addClass('enable');
		}
		
		Navigation.sendStatus();
		
		
		
		//alert(htmlContent);
	},
	
	transcript: function(videoId){
		var vzp;
		vzp = new vzPlayer(videoId);
		var fileName = Framework.courseArray[Framework.currentIndex].cc;
		$.getJSON(Framework.ccPath + Navigation.ccLanguage + "/" + fileName +".json", function(json) {
			var ccText = "";
			for(i=0;i<json.length;i++){
				ccText += '<span start ="' + json[i].start + '" tabindex="' + (9+i+1) + '" id="cc'+i+'" class="ccspan">' + json[i].text + '</span>&nbsp;';
			}
			
			$('.transcriptContent').html(ccText);
			$('.transcriptContent').scrollTop(0);
			$('.ccspan').click(function(){
				vzp.seekTo($(this).attr('start'));
			});
			
			$('.ccspan').keypress(function(event) {
				if(event.keyCode == 13){
					$(document.activeElement).click();	
				}
			});
			 setTimeout(function(){ 
				
				clearInterval(Navigation.interval);
				 vzp.ready(function() {
					Navigation.interval = setInterval(function() {
						vzp.getTime(function(currentTime) {
							for(var j=0; j<json.length; j++) {
								if(parseFloat(json[j].start.toFixed(1)) < parseFloat(currentTime) && parseFloat(json[j].end.toFixed(1)) > parseFloat(currentTime)){
									$('.ccspan').css('background', 'transparent');
									$('#cc'+j).css('background', '#f00');
									$('.transcriptContent').scrollTop = $('#cc'+j).offsetTop - $('#transcript').offsetTop - 40;
									$('#cc'+j).focus();
								}
							}	
						});
					}, 100);
				  });
			}, 3000);	
		});
	},
	
	loaStructure : function(structure, progressObj){
		
		Framework.language = "sp";
		
		Framework.courseArray = new Array();
		document.title = structure.course.title;
		$('#title').html(structure.course.title);
		Framework.courseName = structure.course.title;
		Framework.courseId = structure.course.id;
		Framework.kcPath = structure.course.kcPath;
		Framework.gkcPath = structure.course.gkcPath;
		Framework.botPath = structure.course.botPath;
		Framework.language = structure.course.language ? structure.course.language : 'en';
		
		var str = "<ul>";
		var pages = structure.course.pages;
		var interfaceText = structure.interfaceText;
		
		for (i=0; i<interfaceText.length; i++) {
			if(interfaceText[i].language === Framework.language) {	
				View.updateInterfaceText(interfaceText[i].text);	
			}
		}

		for(i=0;i<pages.length;i++) {
			Framework.PageVisitedStatus[i] = 0;
			var obj = new Object();
			obj.id = i;
			obj.type = pages[i].type;
			obj.displayText = pages[i].displayText;
			obj.link = pages[i].link;
			obj.keywords = pages[i].keywords;
			obj.cc = pages[i].cc;
			Framework.courseArray.push(obj);	
			var moduleTitle = pages[i].displayText.substr(0, pages[i].displayText.indexOf(':'));
			var text = pages[i].displayText.substr(pages[i].displayText.indexOf(':')+1, pages[i].displayText.length);

			str += "<li id='"+i+"' class='link' type='" + pages[i].type + "' tooltip='" + pages[i].tooltip +"' url='" + pages[i].link + "' cc='" + pages[i].cc + "' alt='"+ pages[i].displayText +"'><b>" + moduleTitle + "</b><br/>" + text + "</li>";
		}
		str += "</ul>";
		
		View.updateElements("coursemap",str);
		
		var transcript = structure.course.transcript;
		Framework.ccPath = transcript.path;

		if(transcript.available == "1"){
			Framework.ccAvailable = true;
			if($(document).width() > 800){
				$('#transcriptContainer, #transcriptToggle').show();
			}
		}else{
			$('#transcriptContainer, #transcriptToggle').hide();
			$("#player").css('width', '97%');
		}
		
		var languagesList = structure.course.transcript.lang;
		var languages = '';
		for(i=0;i<languagesList.length;i++) {
			if(i == 0){
				Navigation.ccLanguage = languagesList[i].lang;
				languages += '<div lang="' + languagesList[i].lang + '"class="flag active"><div class="flagIcon active" style="background-image:url(images/'+ languagesList[i].image+')"></div><span class="lang">' + languagesList[i].name + '</span></div>';
			}else{
				languages += '<div lang="' + languagesList[i].lang + '"class="flag"><div class="flagIcon" style="background-image:url(images/'+ languagesList[i].image +')"></div><span class="lang">' + languagesList[i].name + '</span></div>';
			}
			
		};
		View.updateElements("language",languages);
		
		$('.flag').click(function(){
			$('.flag').removeClass('active');
			$(this).addClass('active');
			Navigation.ccLanguage = $(this).attr('lang');
			Navigation.transcript(Framework.videoId);	
		});
		
		
		$(".link").click(function(){
			if($('#coursemapContainer').is(":visible")){
				$('#coursemapContainer').slideToggle();
			}
			Navigation.loadPages($(this));
		});
		$('#container').show();

		Navigation.navigation(progressObj);
		
	},
	navigation:function(options){
		//alert("in navigation :: "  + options.Lesson_location);
		if(options.Lesson_location != "" && options.Lesson_location != null && options.Lesson_location != "undefined"){
			Framework.currentIndex = options.Lesson_location;
			Framework.PageVisitedStatus = options.PageVisitedStatus.split(",")
			Navigation.markCompletion();
			$('#disabler').show();
			$('#bookmark_container').show();
		}else{
			$('#0').click();
		}
		//$('#'+Framework.currentIndex).click();

	},
	
	markCompletion:function(){
		//alert(Framework.PageVisitedStatus.length);
		for(i=0;i<Framework.PageVisitedStatus.length;i++){
			//alert(Framework.PageVisitedStatus[i]);
			if(Framework.PageVisitedStatus[i] == 1){
				$('#'+i).addClass('completed');	
			}
		}
	},
	
	sendStatus:function(){
	
		var cnt = 0;
		for(i=0;i<Framework.PageVisitedStatus.length;i++){
			
			if(Framework.PageVisitedStatus[i] == 1){
				cnt++;
			}
		}
		
		var score = Math.ceil((cnt/Framework.PageVisitedStatus.length)*100);
		if(cnt ==Framework.PageVisitedStatus.length){
			Framework.completion = "completed";
			Navigation.setCourseCompletion();
		}
		
		if(Framework.mode == "scorm"){
			doLMSSetValue(Framework.completion,Framework.currentIndex, Framework.PageVisitedStatus.toString(),score );
		}else if(Framework.mode == "scorm13"){
		
		}else if(Framework.mode == "tincan"){
			Tincan.putData(Framework.currentIndex,Framework.PageVisitedStatus.toString());
		}else{
	
			Web.set(Framework.currentIndex,Framework.PageVisitedStatus.toString());
		}
	},
	
	setCourseCompletion : function() {
		//var StudentName = "sample";
		//var StudentID = "sample"
		var completionObject = {"courseId" : courseId, "reseller" : resellerName, "id" : StudentID, "name": StudentName };
		$.ajax({
			type: "POST",
			url: completionApi,
			data: JSON.stringify(completionObject),
            contentType: "application/json; charset=utf-8",
		});		
	},

	exit:function(){
		if(Framework.mode == "scorm"){
			doLMSFinish();
		}else if(Framework.mode == "scorm13"){
		
		}else if(Framework.mode == "tincan"){
			Tincan.putData();
		}else{
			Web.set(Framework.currentIndex,Framework.PageVisitedStatus.toString());
		}
	}

}