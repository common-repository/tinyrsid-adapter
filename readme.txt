=== Tiny'R'Sid adapter ===
Contributors: wothke
Donate link: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3PE56NSDPUF32&submit=
Tags: Tiny'R'Sid, tinyrsid, music player adapter, C64, chiptune, chip music, retro, demo scene
Requires at least: 4.1
Tested up to: 4.7
Stable tag: `/trunk/`
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

This plugin is an adapter for the Tiny'R'Sid music player and allows to integrate that player as a WordPress widget. 

== Description ==

This plugin is an adapter for the [Tiny'R'Sid](http://www.wothke.ch/tinyrsid/)  music player and allows to integrate that player as a WordPress widget. (Tiny'R'Sid brings back 80ies "Commodore C64" home computer nostalgia by emulating the C64 hardware and playing original C64 music files. Respective music files can be found for example on [HVSC](http://www.hvsc.c64.org/).) 

There currently still is a very active [C64 demo scene](http://csdb.dk/) with regular releases of new C64 productions/music. This plugin may be used to directly play that music from within some WordPress page, e.g. in the blogs maintained by respective demo scene groups or by anybody else that wants to revive some 80ies home computer memories.  

The provided widget can be configured via a standard WordPress admin GUI and it can be easily re-styled via the bundled CSS file. Each instance of the widget can be configured with a playlist of files to be played in sequence. The end user can then interact with the playback using the controls provided by the widget.

Finally the implementation of this plugin may serve as a blueprint for the integration of a variety of other [chiptune players](https://www.wothke.ch/tinyrsid/index.php/webaudio-players) that are currently available for use on the web.




== Installation ==

1. Upload the 'tinyrsid-adapter' plugin folder to the `/wp-content/plugins/` directory, or install the plugin through the WordPress plugins screen directly.
1. Activate the plugin through the 'Plugins' screen in WordPress
1. You can now use the 'Tiny'R'Sid' widget through the 'Appearance->Widgets' screen in WordPress: Either add it to some built-in sidebar/footer or use an additional plugin like 'amr-shortcode-any-widget' to add it within your posts, etc. By default the added widget comes with a configuration that plays the bundled music files, i.e. you can immediately check if the added widget works correctly.
1. Open the added widget instance to access its configuration settings: You may then change the directory where you want to keep your music files, edit your own playlist, and otherwise configure the widget.



== Frequently Asked Questions ==

= What is the 'Music folder' within the widget's settings? =

This is the URL to the folder where you are keeping your music files. By default the configured path points to a sample data folder that comes bundled with the plugin. You should define your own folder so that you do not need to put your data into the plugin directory. Note: The folder MUST be located on the same domain as your WordPress site otherwise the user's browser will typically refuse to load the files (see [cross domain issues](https://en.wikipedia.org/wiki/Same-origin_policy)).


= What format must be used for an entry in the widget's 'Playlist'? =
First of all, one playlist entry corresponds to one line in the playlist, i.e. a 'carrige return' starts a new entry.

In its minimal variant a playlist entry contains the filename of the music file to be played, e.g. "foo.sid". (The referenced file must exist within the configured 'Music folder'.) 

Entries may then be extended (this is optional) to deal with two *.sid file format specific complications:

1. a *.sid file may contain a number of 'tracks'. In order to identify the track that you want to play put a semicolon after the file name and then add the track number, e.g. "foo.sid;3" (track numbering starts at 0)
2. *.sid tracks often play in an endless loop, i.e. a song does not have a predefined playback-time. You can help the player to use a "good" playback time by putting another semicolon after the track number and then add a 'whitespace' separated list of playback times in seconds - one time entry for each track of the *.sid file, e.g. "foo.sid;3;10 9 0 38 111" (this playlist entry might be used if "foo.sid" had 5 tracks and it would cause the selected track 3 to be played for 38 seconds)


= How do I configure a widget's 'Playlist' playback time for a *.sid file that has only one track? =

The playback time configuration explained above requires that a track number has been configured first, i.e. the track number here cannot be omitted even if the file only has one track. A respective entry to play a song for 5 minutes would look like this: "foo.sid;0;300"


= Why does the widget's 'Playlist' entry require playback times for all the tracks of a *.sid file and not just for the one I select? =

Eventhough the playback starts with the track configured within the playlist, the end user might switch the track (multi-track sid files only) using the controls provided by the widget. To allow for a pleasant end user experience it consequently makes sense to provide playback-times for all the tracks (you can always use 0 for those tracks that you are really not interested in).


= What is the 'Autoplay' checkbox in the widget's admin settings for? =

The checkbox controls if the music playback is automatically started as soon as the widget instance is shown or if the widget should rather wait for the end user to actually press the 'play' button.

By default 'Autoplay' is enabled - such that a newly installed plugin can be tested more easily by first time users. However, end users may find it quite annoying when some web page starts to blare when they don't expect it. Consequently you might want to deactivate this feature when using the widget.


= What is the 'Show frequency spectrum' checkbox in the widget's admin settings for? =

By default the widget shows a frequency spectrum of the played music. In order to use the widget on old / weak devices (if necessary) you might want to disable this feature to reduce CPU load.


= Can multiple widgets be shown on the same page? =

Depending on where you use the widget, situations might be constructed where multiple instances are shown on the same web page (e.g. by using the widget in multiple posts and then showing an overview page of all posts, etc). One can imagine unpleasant user experiences where multiple music players are simultaneously starting to play on the same page. But due to the limitations of the current implementation this will not happen: Only *one* Tiny'R'Sid player can actually be used on *one* page. If more than one widget exist on a page, then they all use the same player. Since each widget configures the player upon startup, each additional widget will just overwrite the settings that a previous widget may have made, i.e. the last widget on the page wins. In addition the widget's GUI is currently NOT designed to differenciate multiple instances on the same page: The underlying HTML elements use fixed IDs, and duplicates will be introduced with each additional widget (depending on the respective HTML element the effect will be different, e.g. buttons may just work as copies but a graphics canvas will just be drawn in one place and the copy will stay blank, etc). 

This means that nothing bad will happen, but from the end user perspective the behavior of an affected page would be confusing. A respective scenario should therefore be avoided (e.g. when using the widget within some post you might try to position it such that it is not within the section displayed on an overview page). 


= Anything else? =

Keep in mind that the music playback will stop/restart whenever an affected page is re-loaded. If you intend to just play single songs that may not be an issue. But some longer playlist can only be played to the end if the page that hosts the widget lives long enough (and each reload will restart with the first song in the playlist). Ideally a respective page should be started in a dedicated separate window, such that the browsing activities of the end user do not interfere with the playback. 

There may be better ways to achieve the effect but a separate/dedicated music player browser window could be realized like this:

1. install the above mentioned 'amr-shortcode-any-widget' (which will allow you to embed a widget anywhere you like via a shortcode)
2. then create a specific "Tiny'R'Sid" widget instance within the "Widgets for Shortcodes" (see Appearance->Widgets) section
3. create a new page and embed the above widget instance using the shortcode
4. Within the post where you want use the music just insert a link to the above page (i.e. the "permalink" address of the page). Switch the editor from "Visual" to "Text" mode and edit the generated "a ref=.." link to use a named target window: 'target="_music"'. Use the same target id whenever you create respective links to make sure that the same player windows will be used.

The music player window created above will work but is somewhat ugly due all the extra elements displayed by the standard page layout. The folowing "beautification" tries to fix this by moving the widget from the page into some "popup dialog" (which will hide the underlying layout).

1. install the additional "Popup Maker" plugin
2. create a new popup using "Add Popup" and configure it like this:
3. remove the above embeded widget instance shortcode from the page created above (the page will now only serve as an empty placeholder) and instead put that shortcode into the content of the newly created popup.
4. configure the popup to be always activated for the placeholder page: in "Conditions" use "Pages:ID" and set the respective ID of the placeholder page. Add two "Triggers: "Auto Open" (Delay:0) and a "Click Open" - this will cause the page to always be opened in "popup mode".
5. "Theme" used for the popup should use 100% opacity such that the standard layout in the background is completely hidden. 
6. To make sure that the user cannot exit the "popup mode" disable all the "...to Close" options and get rid of the "Close" button by vertically positioning it outside of the visible area (e.g. -100).


== Screenshots ==

1. This shows what the widget looks like when embedded within some post (a legend in red has been overlayed).
2. This shows the admin GUI used to configure the widget (a legend in red has been overlayed).

== Changelog ==

= 1.0 =
* initial version


== Upgrade Notice ==

= 1.0 =
initial release of the plugin.
