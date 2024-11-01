/*
    WordPress GUI (CSS based)/adapter for using WebAudio version of Tiny'R'Sid
 
	Copyright (C) 2016 Juergen Wothke
 
 LICENSE
 
 This library is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2.1 of the License, or (at
 your option) any later version. This library is distributed in the hope
 that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public
 License along with this library; if not, write to the Free Software
 Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301 USA
*/

/*
* Abstract base that can be subclassed in order to get 'events' from 
* the GUI.
*
* Respective instance can be passed to the player using the 'observer'
* key in the song settings - see example for 'playSID' invokation.
*/	
AbstractSIDObserver = function() {}
AbstractSIDObserver.prototype = {
	triggeredPlayerReady: function() {},
	triggeredReadyToPlay: function() {},
	triggeredTrackEnd: function(externalSongKey) {},
	triggeredSelectedSubsong: function(externalSongKey, trackIdx) {},
};

/*
* This renders the displayed 'frequency spectrum'. 
*
* The following CSS custom properties must be defined to
* parameterize the rendering, e.g.:

	--spectrum-top: 2;
	--spectrum-left: 2;
	--spectrum-width: 337;
	--spectrum-height: 127;
	
	--spectrum-barType: 0;
	--spectrum-barSpacing: 10;
	--spectrum-barWidth: 8;
	--spectrum-barHeigth: 2;

	--spectrum-colors: ['0xF6D565', '0xF6D565', '0x2625D5'];	
*/

function getCSSInt(styles, prop, defaultValue) {
	var v= styles.getPropertyValue(prop);
	if ((v !== undefined) && (v !== null) && (v !== "")) {
		return parseInt(v.trim());		
	}
	return defaultValue;	
}
function getCSSString(styles, prop, defaultValue) {
	var v= styles.getPropertyValue(prop);
	if ((v !== undefined) && (v !== null) && (v !== "")) {
		return v.trim();		
	}
	return defaultValue;	
}

SpectrumRenderer = function (canvasSpectrum) {
	var styles= window.getComputedStyle(canvasSpectrum, null);
	
	// use defaults so that missing CSS isn't fatal
	this.WIDTH= getCSSInt(styles, "--spectrum-width", 200);
	this.HEIGHT= getCSSInt(styles, "--spectrum-height", 50);
	
	canvasSpectrum.width= this.WIDTH;	// for some reason this is necesssary to make it use the configured dimensions
	canvasSpectrum.height= this.HEIGHT;
	
	this.TOP= getCSSInt(styles, "--spectrum-top", 0);
	this.LEFT= getCSSInt(styles, "--spectrum-left", 0);
	
	this.barType= getCSSInt(styles, "--spectrum-barType", 0);
	
	this.capsColor= getCSSString(styles, "--spectrum-capsColor", "red");
	
	var a = getCSSString(styles, "--spectrum-colors", "[grey]").replace(/'/g, '"');
	try {
		this.colors= JSON.parse(a);
	} catch(e) {
		this.colors=[];
	}

	this.barSpacing= getCSSInt(styles, "--spectrum-barSpacing", 1);
	this.barWidth= getCSSInt(styles, "--spectrum-barWidth", 1);
	this.barHeigth= getCSSInt(styles, "--spectrum-barHeigth", 1);
	
	this.numBars = Math.round(this.WIDTH / this.barSpacing);
	this.caps= new Array(this.numBars);
	this.decayRate= 0.99;
	for (var i= 0; i<this.numBars; i++) {this.caps[i]= 0;} 

	this.ctxSpectrum= canvasSpectrum.getContext('2d');
	this.colorOffset=0;
};

SpectrumRenderer.prototype = {
	redrawSpectrum: function() {
		var freqByteData= ScriptNodePlayer.getInstance().getFreqByteData();
		var OFFSET = 0;
		

		this.ctxSpectrum.clearRect(this.LEFT, this.TOP, this.WIDTH, this.HEIGHT);

		this.ctxSpectrum.lineCap = 'round';
		
		if (this.colors) {
			if (this.barType & 0x2) {
				this.colorOffset-= 2;	// cycle this.colors
			}
			if ((this.barType & 0x1) == 1) {
				// "jumping" bars
				 
				for (var i = 0; i < this.numBars; ++i) {
					var scale= freqByteData[i + OFFSET]/0xff;
					var magnitude = scale*this.HEIGHT;

					var p= Math.abs((i+this.colorOffset)%this.numBars);
					
					this.ctxSpectrum.fillStyle = this.colorGradient(this.colors,p/this.numBars);	// computationally much less expensive than previous impl with use of a scaled image
					this.ctxSpectrum.fillRect(this.LEFT+i * this.barSpacing, this.TOP+this.HEIGHT- magnitude, this.barWidth, this.barHeigth*(scale*1.4));
				}
			} else {
				if (this.barType & 0x2) {
					this.colorOffset-= 2;	// cycle this.colors
				}
				// "growing" bars
				for (var i = 0; i < this.numBars; ++i) {
					
					var p= Math.abs((i+this.colorOffset)%this.numBars);

					this.ctxSpectrum.fillStyle = this.colorGradient(this.colors,p/this.numBars);
					
					var s= freqByteData.length-OFFSET;
					
					var magnitude = Math.round(freqByteData[Math.round(OFFSET+s/this.numBars*i)]*this.HEIGHT/255);
					this.ctxSpectrum.fillRect(this.LEFT+i * this.barSpacing, this.TOP+this.HEIGHT, this.barWidth, -magnitude);
					
					this.ctxSpectrum.fillStyle= this.capsColor;
					
					var d=  isNaN(this.caps[i])?0:this.caps[i]*this.decayRate;
					this.caps[i]= Math.max(d, magnitude);
					
					this.ctxSpectrum.fillRect(this.LEFT+i * this.barSpacing, this.TOP+Math.round(this.HEIGHT- this.caps[i]), this.barWidth, this.barHeigth);				
				}		
			}
		}
	},
	colorGradient: function(cols, s) {
		var p= (cols.length-1)*s;
		var i= Math.floor(p);
		
		return this.fadeColor(cols[i], cols[i+1], p-i);
	},
	fadeColor: function(from, to, s) {
		var r1= (from >>16) & 0xff;
		var g1= (from >>8) & 0xff;
		var b1= from & 0xff;

		var r= Math.round(r1+(((to >>16) & 0xff)-r1)*s);
		var g= Math.round(g1+(((to >>8) & 0xff)-g1)*s);
		var b= Math.round(b1+((to & 0xff)-b1)*s);
	
		return "#" +this.hex(r>>4) +this.hex(r) +this.hex(g>>4) +this.hex(g) +this.hex(b>>4) +this.hex(b);
	},
	hex: function(n) {
		var hexChars= "0123456789ABCDEF";
		return hexChars.charAt(n & 0xf);
	}
};

/*
* Some glue code to used to interface between the underlying Tiny'R'Sid player
* and the HTML GUI.
*
* @param observer instance of AbstractSIDObserver
*/	
PlayerProxy = function(observer) {
	this.isStopped= true;
	
	this.observers = [observer];
	
	this.duration= 0;
	this.volume= 1;
};
PlayerProxy.prototype = {
	/*
	* @param songSettings either a string or settings object (see example for 'playSID' invokation below)
	*/
	extractSettings: function(songSettings) {
		if(jQuery.type(songSettings) === "string") {
			// expected format: "url;trackIdx;timeout" - does not allow to configure different timeouts for the tracks
			this.currentSongExternalKey= null;
			this.currentSongTimings= null;
			this.currentSongOptions= this.splitOptions(songSettings);
			this.autoplay= true;
		} else {
			// API that allows to specify dedicated timeouts for different tracks and to receive 
			// events in external code
			
			if ((this.observers.length == 1) && (songSettings.observer !== undefined)) {
				var o = songSettings.observer;				
				this.observers.push(o.impl);			
			}
			
			if (songSettings.song !== undefined) {
				var song= songSettings.song;

				this.currentSongExternalKey= (song.externalKey !== undefined) ? song.externalKey : null;

				this.currentSongTimings= (song.timings !== undefined)? song.timings.split(" ") : [];
						
				var track= isNaN(song.track) ? 0 : song.track;
				var timeout= 300;
				if (this.currentSongTimings.length > track) {
					timeout= parseInt(this.currentSongTimings[track]);
				}
				
				// options config expected by Tiny'R'Sid (for the playback of a specific track)
				if (song.path !== undefined) {
					this.currentSongOptions= [song.path, {track: track, timeout: timeout}];
				} else {
					this.currentSongOptions= null;
				}
				this.autoplay= (song.autoplay !== undefined) ? song.autoplay : true;
			}
		}
    },	
	
	playSong: function(songSettings) {		
		if(jQuery.type(songSettings) !== "string") {
			songSettings = { song: songSettings};
		}
		this.extractSettings(songSettings);
		
		this.loadCurrentSong(false);		
    },

	init: function(songSettings, enableSpectrum){
		this.extractSettings(songSettings);
		
		function doOnTrackEnd(){		
			this.observers.forEach(function(o, idx) { o.triggeredTrackEnd(this.currentSongExternalKey); }.bind(this)); 			
		}
		
		function doOnTrackReadyToPlay(){
			this.duration= ScriptNodePlayer.getInstance().getPlaybackTimeout();
			
			if(this.autoplay) {
				ScriptNodePlayer.getInstance().play();
			}
			this.observers.forEach(function(o, idx) { o.triggeredReadyToPlay(); }.bind(this)); 
		}

		function doOnPlayerReady() {
			this.observers.forEach(function(o, idx) { 
				o.triggeredPlayerReady(); 
			}.bind(this)); 
								
			this.loadCurrentSong(false);
		}
		
		var basePath= '';		// not needed here
		ScriptNodePlayer.createInstance(new SIDBackendAdapter(), basePath, [], enableSpectrum, doOnPlayerReady.bind(this),
											doOnTrackReadyToPlay.bind(this), doOnTrackEnd.bind(this));
	},
	getTracks: function() {
		return ScriptNodePlayer.getInstance().getSongInfo().maxSubsong;
	},
	getCurrentTrack: function() {
		return ScriptNodePlayer.getInstance().getSongInfo().actualSubsong;
	},
	setVolume: function(volume) {
		this.volume = volume;
		ScriptNodePlayer.getInstance().setVolume(this.volume);
	},
	getVolume: function() {
		return this.volume;
	},
	
	getDuration: function(){
		return this.duration;
	},
	changeTrack: function(trackIdx){
		if (this.currentSongOptions !== null) {
			this.pause();
			this.currentSongOptions[1].track= trackIdx;
					
			var timeout= 300;
			if (this.currentSongTimings.length > trackIdx) {
				timeout= parseInt(this.currentSongTimings[trackIdx]);
			}
			this.currentSongOptions[1].timeout= timeout;		
			
			this.loadCurrentSong(false);
		}
	},
	
	togglePlay: function(){
		if (this.isPaused()){
			this.play();
			return true;
		}else {
			this.pause();
			return false;
		}	
	},
	pause: function(){
		ScriptNodePlayer.getInstance().pause();
	},
	isPaused: function(){
		return ScriptNodePlayer.getInstance().isPaused();
	},	
	stop: function(){
		ScriptNodePlayer.getInstance().pause();
		this.isStopped= true;	// trigger reload to rollback to start position
	},
	play: function(){
		if (this.isStopped) {
			this.loadCurrentSong(true);	// restart from beginning
		}
		ScriptNodePlayer.getInstance().play();	// resume from pause
	},
	getAuthor: function(){
		return ScriptNodePlayer.getInstance().getSongInfo().songAuthor;
	},
	getTitle: function(){
		return ScriptNodePlayer.getInstance().getSongInfo().songName;
	},
	getReleased: function(){
		return ScriptNodePlayer.getInstance().getSongInfo().songReleased;
	},
	splitOptions: function(someSong) {
		if (someSong !== undefined) {
			var arr= someSong.split(";");					
			var track= arr.length>1?parseInt(arr[1]):-1;
			var timeout= arr.length>2?parseInt(arr[2]):-1;

			// you'll be needing your own proxy here..
			var url=  arr[0];
				
			var options= {};
			options.track= track;
			options.timeout= timeout;
								
			return [url, options];					
		} else {
			return null;					
		}		
	},

	loadCurrentSong: function(forcePlay){
		var p= ScriptNodePlayer.getInstance();
		var ready= p.isReady();
		if (ready) {			 
			if (this.currentSongOptions !== undefined) {
				p.loadMusicFromURL(this.currentSongOptions[0], this.currentSongOptions[1], 
					(function(filename){
						var trackIdx= this.currentSongOptions[1].track;
						this.observers.forEach(function(o, idx) { o.triggeredSelectedSubsong(this.currentSongExternalKey, ""+trackIdx); }.bind(this)); 
						this.isStopped= false; if (!forcePlay && !this.autoplay) p.pause(); }.bind(this)),	// xxx don't autoplay 
					(function(){ /* no point trying to play this again */ }.bind(this)), 
					(function(total, loaded){}));
			}
		}	
	},
};

	
/*
* HTML GUI specific stuff...
*/
(function ( $ ) {
    $.fn.sidgui = function(options, enableSpectrum) {
		var htmlOutput = '<div class="tinyrsid-container tinyrsid">\
		  <div class="spectrumClass">\
				<canvas class="spectrumCanvas" id="spectrumCanvas"></canvas>\
		</div>\
		<div class="tinyrsid-meta">\
			<span id="songTitle"></span>\
			<span id="songAuthor"></span>\
			<span id="songReleased"></span>\
		</div>\
		<div class="tinyrsid-controls-wrapper">\
			<div class="tinyrsid-controls">\
				<button type="button" class="tinyrsid-play"></button>\
				<button type="button" class="tinyrsid-stop"></button>\
				<span class="tinyrsid-time-current"></span>\
				<div class="tinyrsid-progress-bar"></div>\
				<span class="tinyrsid-time-total"></span>\
				<div class="tinyrsid-speaker"></div>\
				<div class="tinyrsid-volume"></div>\
			</div>\
		</div>\
		<div class="tinyrsid-controls2-wrapper">\
			<div class="tinyrsid-controls2">\
				<button type="button" class="tinyrsid-up"></button>\
				<span class="tinyrsid-tracks">0/0</span>\
				<button type="button" class="tinyrsid-down"></button>\
			</div>\
		</div>\
		<div class="tinyrsid-info"></div>\
		</div>';		
		this.append(htmlOutput);
				
        function setEventStatusChange(s){
            if (options.onStatusChange !== undefined){
                options.onStatusChange(s);
            }
        }
	
		var canvasSpectrum = document.getElementById('spectrumCanvas');
		if (canvasSpectrum == undefined) return null;
		
		var renderer= new SpectrumRenderer(canvasSpectrum);
		var playerProxy;
		
		
		var btnPlay = $('.tinyrsid-play');
		btnPlay.on('click', function() {
			if (window['global-togglePlay']()){		// injected below			
				btnPlay.trigger('focus');
				btnPlay.addClass('isPlaying');
				btnPlay.addClass('pulse');
				
				setEventStatusChange('playing');
			}else {
				btnPlay.removeClass('isPlaying');
				btnPlay.removeClass('pulse');
				
				setEventStatusChange('paused');
			}
		} );
				
		var btnStop = $('.tinyrsid-stop');		
		btnStop.on('click', function() {
			window['global-stopPlay']();			// injected below			

			btnStop.trigger('focus');
			btnPlay.removeClass('isPlaying');
			btnPlay.removeClass('pulse');
			
			setEventStatusChange('stopped');
		} );
		
		var btnUp = $('.tinyrsid-up');		
		btnUp.on('click', function() {			
			if (playerProxy.getCurrentTrack() < playerProxy.getTracks()) {
				playerProxy.changeTrack(playerProxy.getCurrentTrack()+1);			
				setEventStatusChange('track up');
			}
		} );
		
		var btnDown = $('.tinyrsid-down');		
		btnDown.on('click', function() {
			if (playerProxy.getCurrentTrack() > 0) {
				playerProxy.changeTrack(playerProxy.getCurrentTrack()-1);			
				setEventStatusChange('track down');
			}
		} );

		var currentTimeInfo = $('.tinyrsid-time-current');
		var totalTimeInfo = $('.tinyrsid-time-total');
		var progressBar = $('.tinyrsid-progress-bar');

		var spanTitle = $('#songTitle');
		var spanAuthor = $('#songAuthor');
		var spanReleased = $('#songReleased');
				
		var spanTrackInfo = $('.tinyrsid-tracks');
		
		InternalObserver = (function(){ var $this = function () { 
				$this.base.call(this);
			}; 
			extend(AbstractSIDObserver, $this, {
				triggeredPlayerReady: function() {
					setEventStatusChange('player ready');						
				},
				triggeredReadyToPlay: function() {
					setEventStatusChange('song ready to play');	
					totalTimeInfo.text( formatTime( playerProxy.getDuration() ) );
					
					spanTitle.html("title: " + playerProxy.getTitle());
					spanAuthor.html("author: " + playerProxy.getAuthor());
					spanReleased.html("released: " + playerProxy.getReleased());

					spanTrackInfo.html(""+playerProxy.getCurrentTrack() +"/"+playerProxy.getTracks() );
					
					if(!playerProxy.isPaused()) {
						btnPlay.trigger('focus');
						btnPlay.addClass('isPlaying');
						btnPlay.addClass('pulse');
					} else {
						btnPlay.trigger('focus');
						btnPlay.removeClass('isPlaying');
						btnPlay.removeClass('pulse');
					}					
				},
				triggeredTrackEnd: function(externalSongKey) {
					btnStop.trigger( "click" );
					setEventStatusChange('song_finished');
				},
			});	return $this; })();	

		
		
		playerProxy = new PlayerProxy(new InternalObserver());
		window['global-togglePlay']= playerProxy.togglePlay.bind(playerProxy);
		window['global-stopPlay']= playerProxy.stop.bind(playerProxy);
		playerProxy.init(options, enableSpectrum);

		function formatTime(sec) {
			if (isNaN(sec)) return	"--:--";

			min = Math.floor(sec / 60);			
			min = (min >= 10) ? min : "0" + min;
			sec = Math.floor(sec % 60);
			sec = (sec >= 10) ? sec : "0" + sec;
			return min + ":" + sec;
		}
		function checkProgress(c,t){
			var p = parseInt((c * 100) / t);
			progressBar.progressbar( "value",  p );
		}
		function updateGUI(){
			var t= ScriptNodePlayer.getInstance().getCurrentPlaytime();
			currentTimeInfo.text( formatTime( t ) );
			checkProgress(t, playerProxy.getDuration());
			
			renderer.redrawSpectrum();
			
			window.requestAnimationFrame(updateGUI);
		}
		
		// since "seek" not available there is no point using a slider..
		progressBar.progressbar({});
				
		playerProxy.setVolume(0.75);
		
		// hack to fix mootools conflict (see disappearing slider in Joomla integration)
	//	jQuery('.tinyrsid-volume')[0].slide = null;
		var vol = jQuery('.tinyrsid-volume');

		vol.slider({			
			animate: 'fast',
			slide: function(event, ui) {
				playerProxy.setVolume(ui.value / 100);
                setEventStatusChange('volumen_changing');
			},
			value: playerProxy.getVolume()*100
		});

		updateGUI();	// install "requestAnimationFrame"

		// expose access to "playSong" API
		
		var extAPI= {};
		extAPI.$this= this;
		extAPI.playSong=function(song) { playerProxy.playSong(song) }.bind(playerProxy);
        return extAPI;
    };

}( jQuery ));



