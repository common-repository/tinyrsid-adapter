<?php
/**
 * @package TinyRSid_Adapter
 * @version 1.0
 */
/*
Plugin Name: Tiny'R'Sid adapter
Plugin URI: http://wordpress.org/plugins/tinyrsid-adapter/
Description: This plugin is an adapter for the Tiny'R'Sid music player and allows to integrate that player as a Wordpress widget.
Version: 1.0
Author: Juergen Wothke
Author URI: https://jwothke.wordpress.com/
*/

// defaults to be manually reconfigured in the admin GUI:
$default_folder= 'sample';
$default_playlist= 'LMan - Vortex.sid;0;183
funktest.sid;0;123
unleash.sid;0;267
LMan - Confusion 2015 Remix.sid;0;246';

$lib= (stripos(get_site_url(),'https') === true ? 'https:' : 'http:').'//www.wothke.ch/tinyrsid/libs/';


function tinyrsid_css_and_js() {	
	wp_register_style('tinyrsid_font', plugins_url('css/font.css',__FILE__ ));
	wp_enqueue_style('tinyrsid_font');
	wp_register_style('tinyrsid_css', plugins_url('css/skin-tinyrsid.css',__FILE__ ));
	wp_enqueue_style('tinyrsid_css');
		
	wp_enqueue_script('jquery');
	wp_enqueue_script('jquery-ui-progressbar');
	wp_enqueue_script('jquery-ui-slider');
	
	wp_register_script('scriptplayer_js', $GLOBALS['lib'].'scriptprocessor_player.min.js',__FILE__ );
	wp_enqueue_script('scriptplayer_js');	
	wp_register_script('backend_js', $GLOBALS['lib'].'backend_tinyrsid.min.js',__FILE__ );
	wp_enqueue_script('backend_js');

	wp_register_script('tinyrsid_adapter_js', plugins_url('adapter_tinyrsid.js',__FILE__ ));
	wp_enqueue_script('tinyrsid_adapter_js');
}
add_action( 'init','tinyrsid_css_and_js');
		
/**
 * Adds TinyRSid_Widget widget.
 */
class TinyRSid_Widget extends WP_Widget {

	/**
	 * Register widget with WordPress.
	 */
	function __construct() {
		parent::__construct(
			'tinyrsid_widget', // Base ID
	esc_html__( 'Tiny\'R\'Sid', 'text_domain' ), // Name
			array( 'description' => esc_html__( 'Tiny\'R\'Sid adapter widget', 'text_domain' ), ) // Args
		);
	}

	/**
	 * Front-end display of widget.
	 *
	 * @see WP_Widget::widget()
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Saved values from database.
	 */
	public function widget( $args, $instance ) {
		extract( $args, EXTR_SKIP );
		
		$title = empty( $instance['title'] ) ? '' : apply_filters( 'widget_title', $instance['title'] );
		if( empty( $instance['folder'] )) {
			// by default use 'samples' folder bundled with the plugin
			$dir= plugins_url($GLOBALS['default_folder'],__FILE__ );
		} else {
			$dir = apply_filters( 'widget_title', $instance['folder'] );				
		}
		$text = empty( $instance['text'] ) ? $GLOBALS['default_playlist'] : apply_filters( 'widget_text', $instance['text'] );
		
		// for JavaScript
		$spectrumEnable = !isset( $instance['spectrum_enable'] ) ? 'true' : (($instance[ 'spectrum_enable' ] == 'on') ? 'true' : 'false');		
		$autoplayEnable = !isset( $instance['autoplay_enable'] ) ? 'true' : (($instance[ 'autoplay_enable' ] == 'on') ? 'true' : 'false');
	

		$array = explode(PHP_EOL, $text);
		foreach ($array as $line) {
			$song = $line;				
		} 
	
		echo $args['before_widget'];
		if ( $title )
			echo $args['before_title'] . $title . $args['after_title'];

		echo '<div class="custom-widget">';

 ?>
<div id="sid-wrapper-div" class="sid-wrapper-div" >
<div id="sid-player-div" class="sid-player-div" ><div class="sid-player"></div></div>
<div id="dd" class="playlist-dropdown">
	<span>select song to be played</span>
	<ul class="dropdown">
<?php 
		foreach ($array as $line) {	
			$songOptions = explode(';', $line);
			echo '<li><a href="#"><i></i>'.$songOptions[0].'</a></li>';
		} 
 ?>
	</ul>
</div>
					
<script type="text/javascript">
	// configuration from admin GUI
	var autoPlay= <?php echo $autoplayEnable; ?>;
	var songPath= "<?php echo $dir.'/'; ?>";
	var enableSpectrum= <?php echo $spectrumEnable; ?>;
	var playList= [];
<?php 
	foreach ($array as $line) {
		$line= trim($line);	// get rid of garbage potentially created from linefeed..
		echo "playList.push('".$line."');";	
	} 
?>

	// basic player setup
	PlayListHandler = (function(){ var $this = function (path, list, autoplay) {
				$this.base.call(this);
				$this.songPath= path;
				$this.playList= list;
				$this.autoPlay= autoplay;
			};
			extend(AbstractSIDObserver, $this, {
				triggeredTrackEnd: function(externalSongKey) {
					var nextIdx= (parseInt(externalSongKey) +1) % $this.playList.length;
				
					playSong(nextIdx, true);	// keep playing
				},
				triggeredSelectedSubsong: function(externalSongKey, trackIdx) {
				},
				getSongConfig: function(idx) {
					var cfg= $this.playList[idx];
					var res = cfg.split(";");
					
					var file= null;
					var track= 0;
					var songlengths= "";
					
					if (res.length > 0) file= $this.songPath+res[0];
					if (res.length > 1) track= parseInt(res[1]);
					if (res.length > 2) songlengths= res[2];
					
					return {path: file, track: track, timings: songlengths, autoplay: $this.autoPlay, externalKey: idx}
				}
			});	return $this; })();	
			
	var playlistHandler= new PlayListHandler(songPath, playList, autoPlay);

	jQuery(function(){
		$audioPlayer = jQuery(".sid-player").sidgui({
				/* song: playlistHandler.getSongConfig(0), don't autostart here - let playlist do its job */
				observer: {impl: playlistHandler},
				onStatusChange: function(e){
					console.log(e);
				}
			}, enableSpectrum
		);
		
	});
	jQuery(".sid-player").show();
	
	
	// playlist GUI	
	function DropDown(el) {
		this.dd = el;
		this.placeholder = this.dd.children('span');
		this.opts = this.dd.find('ul.dropdown > li');
		this.val = '';
		this.index = -1;
		this.initEvents();
	}
	DropDown.prototype = {
		setSelection : function(idx) {
			var obj = this;						
			var item= obj.opts[idx];
			obj.val = item.innerText;
			obj.index = idx;

			this.setIcons(idx);
			obj.placeholder.text(obj.val);
		},
		previousSelectionIdx : function() {
			var obj = this;
			var i;
			for(i= 0; i<obj.opts.length; i++) {
				var item= obj.opts[i];
				
				var i2= item.children.item(0).children.item(0);
				
				if (i2.className == 'musicIcon') return i;
			}
			return -1;
		},		
		setIcons : function(selectedIdx) {
			var obj = this;
			var i;
			for(i= 0; i<obj.opts.length; i++) {
				var item= obj.opts[i];
				
				var i2= item.children.item(0).children.item(0);
				i2.className= (selectedIdx==i)?'musicIcon':'';
			}					
		},		
		initEvents : function() {
			var obj = this;

			obj.dd.on('click', function(event){
				jQuery(this).toggleClass('active');
				return false;
			});

			obj.opts.on('click',function(){
				var opt = jQuery(this);
				obj.val = opt.text();
				obj.index = opt.index();
				
				var previousSelectionIdx= obj.previousSelectionIdx();
				if (obj.index != previousSelectionIdx) {
					obj.setIcons(obj.index);
					
					playSong(obj.index, null);
				}
			});
		},
		getValue : function() {
			return this.val;
		},
		getIndex : function() {
			return this.index;
		}
	}
	
	jQuery(function() {		
		$dropdown= new DropDown( jQuery('#dd') );

		jQuery(document).click(function() {
			jQuery('.playlist-dropdown').removeClass('active');
		});
		
		if (autoPlay)
			playSong(0, null);	// start with 1st song in playlist

	});

	function playSong(idx, forcePlay) {
		$dropdown.setSelection(idx);

		var cfg= playlistHandler.getSongConfig(idx);
		
		if (true == forcePlay)
			cfg['autoplay']= true;
		
		$audioPlayer.playSong(cfg);
	}


</script>
	
		</div>
		</div>
		<?php echo $args['after_widget'];
	}

	/**
	 * Back-end widget form.
	 *
	 * @see WP_Widget::form()
	 *
	 * @param array $instance Previously saved values from database.
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, array( 'title' => '' ) );
		$title = esc_attr( $instance['title'] ); 

		$folder = esc_attr( $instance['folder'] ); 
		if (empty($folder)) {
			$folder= plugins_url($GLOBALS['default_folder'],__FILE__ );
		}
		if (empty($instance['text'])) 
			$text= $GLOBALS['default_playlist'];
		else 
			$text = esc_textarea($instance['text']); 

		$freqEnable = !isset($instance[ 'spectrum_enable' ]) ? 'on' : $instance[ 'spectrum_enable' ];		// default: enable (so that 1st time users get music without need to do anything)
		$playEnable = !isset($instance[ 'autoplay_enable' ]) ? 'on' : $instance[ 'autoplay_enable' ];
		
		?>
		
		<div class="donate" id="donate" alt= "If you like this plugin, please make a donation as a token of your appreciation for my work (this button will take you to the secure PayPal page to let you conclude a respective transaction). Any time that I might invest into the future maintenance of this plugin or into additional WordPress projects depends on it. Thank you!">
			<a target="_blank" href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3PE56NSDPUF32&submit=">
				<!-- too bad an external server access is needed just to fetch the bloody PayPal icon but it is propably not GPL so it cannot be bundled in WordPress.. -->
				<img alt="PayPal - The safer, easier way to pay online!" border="0" src="<?php echo 'https://www.paypalobjects.com/en_GB/i/btn/btn_donate_LG.gif'; ?>" >
			</a>
		</div>
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title:', '' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo $title; ?>" />
		    <label for="<?php echo $this->get_field_id( 'folder' ); ?>"><?php _e( 'Music folder:', '' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'folder' ); ?>" name="<?php echo $this->get_field_name( 'folder' ); ?>" type="text" value="<?php echo $folder; ?>" />
			<label for="<?php echo $this->get_field_id( 'text' ); ?>"><?php _e( 'Playlist:', '' ); ?></label>
			<textarea class="widefat" rows="16" cols="20" id="<?php echo $this->get_field_id('text'); ?>" name="<?php echo $this->get_field_name('text'); ?>"><?php echo $text; ?></textarea>
			<input class="checkbox" type="checkbox" <?php checked( $freqEnable, 'on' ); ?> id="<?php echo $this->get_field_id( 'spectrum_enable' ); ?>" name="<?php echo $this->get_field_name( 'spectrum_enable' ); ?>" /> 
			<label for="<?php echo $this->get_field_id( 'spectrum_enable' ); ?>">Show frequency spectrum</label>
			<input class="checkbox" type="checkbox" <?php checked( $playEnable, 'on' ); ?> id="<?php echo $this->get_field_id( 'autoplay_enable' ); ?>" name="<?php echo $this->get_field_name( 'autoplay_enable' ); ?>" /> 
			<label for="<?php echo $this->get_field_id( 'autoplay_enable' ); ?>">Autoplay</label>
		</p><?php
	}

	/**
	 * Sanitize widget form values as they are saved.
	 *
	 * @see WP_Widget::update()
	 *
	 * @param array $new_instance Values just sent to be saved.
	 * @param array $old_instance Previously saved values from database.
	 *
	 * @return array Updated safe values to be saved.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = array();
		$instance['title'] = ( ! empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
		$instance['folder'] = ( ! empty( $new_instance['folder'] ) ) ? strip_tags( $new_instance['folder'] ) : '';
		$instance['text'] =  $new_instance['text'];
		
		// replace 'empty' with some explicit 'off' marker (so that 'undefined' can be distinguished from 'off')
		$freqEnable = !isset($new_instance[ 'spectrum_enable' ]) ? 'off' : $new_instance[ 'spectrum_enable' ];
		$playEnable = !isset($new_instance[ 'autoplay_enable' ]) ? 'off' : $new_instance[ 'autoplay_enable' ];
			
	    $instance[ 'spectrum_enable' ] = $freqEnable;
	    $instance[ 'autoplay_enable' ] = $playEnable;
		return $instance;
	}

} // class TinyRSid_Widget

function register_tinyrsid_widget() {
    register_widget( 'TinyRSid_Widget' );
}
add_action( 'widgets_init', 'register_tinyrsid_widget' );
	
	?>