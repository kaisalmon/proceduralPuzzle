var iframe_server_url;
iframe_server_url = "https://iframe.coinmode.com";
//iframe_server_url = "http://localhost:8080/?game_id=91#/";
//iframe_server_url = "http://localhost:18080/?game_id=91#/";


function CoinMode( params, options )
{
	// Variables
	var coinmode_iframe_id = "coinmode_iframe";
	this.params = params;
	if( this.params == null )
	{
		params = {};
		/*
		Callbacks:
			on_iframe_loaded(err) - Called when the iframe is loaded in
			on_iframe_visible(err) - Called whenever the iframe is shown
			on_iframe_hidden(err) - Called when hidden
		*/
		alert("Missing params when creating CoinMode Object.  Please make sure you have at least passed in the game_id param");
	}
	this.params.optional = {};
	if( params.optional != null )
	{
		this.params.optional.suggested_new_display_name = params.optional['suggested_new_display_name'];
		this.params.optional.suggested_new_email_name = params.optional['suggested_new_email_name'];
		this.params.optional.referral_code = params.optional['referral_code'];
	}

	var cmobj = this;

	cmobj._registered_command_callbacks = {};  // This will contain a list of functions to invoke should an input command come in.
	/* E.g.
		cmobj._registered_command_callbacks['when_done_something'] = [ functioncb1, functioncb2, ... ]
		user receiveCommandFromIFrame(command, fn)  to append to this.
	*/



	// Functions
	// Internal to load the iframe CoinMode launchpad window
	this._load_iframe = function( on_completed )
	{
		var methods = params['methods'];
		debug.log("Running init");
		// Load iFrame with page for game params.game_id
		iframe = document.getElementById( coinmode_iframe_id );
		if( iframe == null )
		{
			create_iframe( iframe_server_url );
		}

		function create_iframe(url) {
			// Check iframe doesn't already exist
			var iframe = document.createElement("iframe");
			iframe.onload = function(data, data2) {
				on_iframe_loaded_internal(data, data2);
			};
			iframe.onerror = function() {
				alert("There was an error loading the iframe");
			};
			iframe.setAttribute("id", coinmode_iframe_id);
			iframe.style.visibility = "hidden";
			iframe.src = url;
			iframe.name = "frame"
			document.body.appendChild(iframe);
			return frames["frame"].location.host;
		}

		// Called when the iframe is loaded
		function on_iframe_loaded_internal(data, data2)
		{
	        // Listen to message from child window
			bindEvent(window, 'message', function (e)
				{

				var data = {};
				var data_raw = e['data'];

				// This is probably unnecessary now since it returns a JSON object not a string but for future proofing
				if( typeof( data_raw ) == "string" )
				{
					console.log( "data_raw is text and shows" );
					console.log( data_raw );
					try
					{
						data = JSON.parse( data_raw );
					}
					catch(e)
					{
						console.log("ERROR: Retrieved a window Message that was not a valid JSON string.");
						console.log("ERROR Parsing: "+data_raw);
						console.log("ERROR: "+e.data);
					}
				}
				else
				{
					// An object was already returned so no parsing needed.
					data = data_raw;
				}
				// Check for any registered responses
				var command = data['command'];
				var array_callbacks_for_command = cmobj._registered_command_callbacks[command];
				if( array_callbacks_for_command != null )
				{
					for( var i = 0; i< array_callbacks_for_command.length;i++)
					{
						var callback = array_callbacks_for_command[i];
						if( callback != null )
						{
							if( callback( data ) == false )
							{
								// The callback returned false so can be removed safely now
								array_callbacks_for_command[i] = null;
							}
						}
					}
					// Flush out any empty slots
					cmobj._registered_command_callbacks[command] = cmobj._registered_command_callbacks[command].filter(function(e){return e});
				}
			});


			var timeoutObject;

			receiveCommandFromIFrame( "from_iframe_yes_i_am_alive", function( data )
				{
					console.log("main window: Yes I've receive a message from the iframe saying I'm alive" );
					if( timeoutObject != null )
					{
						clearTimeout( timeoutObject );
						timeoutObject = null;
					}

					// Flag the the iframe is loaded
					cmobj.iframe_status = "ready";

					// Yes we know it is alive so can flag it as the iframe has loaded
					if( methods['on_iframe_loaded'] != null )
					{
						if( typeof( methods['on_iframe_loaded'] ) == 'function' )
						{
							methods['on_iframe_loaded']( null, this.params );
						}
						else
						{
							debug.error("The on_iframe_loaded is not a function");
						}
					}
					else
					{
						debug.warning("The on_iframe_loaded callback has not been set in params.method.");
					}
				}
			);

			// An error timeout to call if we don't get a reply from 'I am alive' message
			var timeout_duration_for_iframe_error = 1000;

			// If there was a timeout object from before clear this to ensure we don't get multiple calls.
			if( timeoutObject != null )
			{
				clearInterval( timeoutObject ) ;
			}

			timeoutObject = setTimeout( function()
			{
				alert("There has been an error loading the iframe");
				if( methods['on_iframe_loaded'] != null )
				{
					if( typeof( methods['on_iframe_loaded'] ) == 'function' )
					{
						methods['on_iframe_loaded']( "Error interacting with local CoinMode iFrame.  Usually the page didn't load or cross iframe messages are blocked.", cmobj.params );
					}
				}
			}, timeout_duration_for_iframe_error );


			// Send a ping message to see if it's loaded, if we don't receive the reply we know it failed to load correctly or messages are blocked.. either way we need to abort at this stage
			sendToIFrame( "to_iframe_are_you_alive" );

		}

		// Get playtoken for the game.
		return this;
	}



	// If we ever need to unload an iframe to save memory you can call this method.
	this._unload_iframe = function()
	{
		var element = document.getElementById("coinmode_iframe");
		element.parentNode.removeChild(element);
		this.iframe_status = "none";
	}

	cmobj._show_iframe = function()
	{
		var iframe = document.getElementById( coinmode_iframe_id );
		if( iframe )
		{
			iframe.style.visibility = "visible";
			this.iframe_visible = true;
		}
		else
		{
			debug.log("No iframe found to show in _show_iframe");
		}
		if( typeof( this.params.on_iframe_visible ) === 'function' )
		{
			// Call the callback
			this.params.on_iframe_visible();
		}
	}



	cmobj._hide_iframe = function()
	{
		var iframe = document.getElementById( coinmode_iframe_id );
		if( iframe )
		{
			document.getElementById( coinmode_iframe_id ).style.visibility = "hidden";
			this.iframe_visible = false;
		}
		else
		{
			debug.log("No iframe found to hide in _hide_iframe");
		}
		if( typeof( this.params.on_iframe_hidden ) === 'function' )
		{
			// Call the callback
			this.params.on_iframe_hidden();
		}
	}


	var sendToIFrameAndWaitForReponse = function( command, msg, callback )
	{
		/* Wait for the event for when the iframe is closed.  This should contain a message of
		{
			command : "new_round",
			data: {blob of useful data}
			error : "reason for error"
		}
		*/

		sendToIFrame(command, msg);
	}

	// Hide the iframe
	// parent.document.getElementById('myframeId').style.display='none'

	// Send a message to the child iframe
	var sendToIFrame = function(command, msg) {
		var data_package =
		{
			"command" : command,
			"version" : 1.0,
			"data": data_to_send
		};
		var data_to_send = JSON.stringify( data_package );
		// Make sure you are sending a string, and to stringify JSON
		var iframeEl = document.getElementById( coinmode_iframe_id );
		if( iframeEl != null )
		{
			iframeEl.contentWindow.postMessage(data_to_send, '*');
		}
		else
		{
			debug.error("Unable to find iframe named:"+coinmode_iframe_id);
		}
	};



	function bindEvent(element, eventName, eventHandler) {
		if (element.addEventListener){
			element.addEventListener(eventName, eventHandler, false);
		} else if (element.attachEvent) {
			element.attachEvent('on' + eventName, eventHandler);
		}
	}



	function receiveCommandFromIFrame( command, callback )
	{
		if( cmobj._registered_command_callbacks[command] == null )
		{
			cmobj._registered_command_callbacks[command] = [];
		}
		cmobj._registered_command_callbacks[command].push( callback );
		debug.log("SR: cmobj._registered_command_callbacks[command].length:"+cmobj._registered_command_callbacks[command].length);
	}



	function clearCommandFromIFrame( command )
	{
		if( cmobj._registered_command_callbacks == null )
		{
			cmobj._registered_command_callbacks = {};
		}
		cmobj._registered_command_callbacks[command] = [];
	}







	// Helper API calls that will open up the iframe if needed
	this.helper = {};

	cmobj.when_iframe_loaded = function( on_loaded, params )
	{
		if( cmobj.iframe_status != "ready" )
		{
			var callee = "Unknown";
			try
			{
				callee = arguments.callee.caller.name;
			}
			catch(e)
			{
				debug.warning("Unable find the name of the function that was called before the CoinMode iFrame was ready.  Place a breakpoint here to discover it if necessary");
			}

			debug.warning("Attempting to call helper API ("+callee+") before the iFrame is loaded.  Please call init first with params.methods.on_iframe_loaded set so you know when the iframe has successfully loaded or failed to load");

			// We therefore can wait for the iframe to be ready and continue
			receiveCommandFromIFrame( "from_iframe_yes_i_am_alive", function()
				{
					on_loaded( params );
				}
			);
			return;
		}

		try
		{
			if( typeof( on_loaded ) == 'function' )
			{
				return on_loaded( params );
			}
			else
			{
				debug.error("There was no callback function given for when_iframe_loaded test");
			}
		}
		catch(e)
		{
			debug.error("There was an error in the callback given to when_iframe_loaded");
			console.log(e);
		}
	}

	/**
	 * This will obtain a playtoken for a given player and this game.
	 * @callback on_playtoken_obtained( err, playtoken, details ) - Function to be called with the result
	 */
	this.helper.getPlaytoken = function( on_playtoken_obtained )
	{
		// Check that the iframe has loaded before we do this.
		cmobj.when_iframe_loaded( function()
		{

			// Do we have an existing playtoken?  If so, is it still valid to use or do we need to refresh it?
			// TODO: Check existing playtoken

			// Now the iframe has loaded, attempt to grab a playtoken
			// Send message to ask for a new playtoken.
			var data =
			{
				"game_id":this.game_id,
				//"hint_displayname":this.params.optional['suggested_new_display_name'], /* This is if the player clicks CreateNew it will default to this as their default name */
				//"hint_email":this.params.optional['suggested_new_email_name'], /* For new player, this will offer a default email address for them to use */
				//"referral_code":this.params.optional['referral_code'], /* Any campaign referral code if given */
			}
			cmobj._show_iframe();
			sendToIFrame( "toiframe_playtokenrequest", data );

			// Now wait on close by deposit
			receiveCommandFromIFrame( "show_iframe", function( data )
				{
					cmobj._show_iframe();
					return false;
				}
			);
			receiveCommandFromIFrame( "from_iframe_no_access", function( data )
				{
					console.log("The user denied access");
					cmobj._hide_iframe();
					on_playtoken_obtained( "Denied", null, data );
					return false;
				}
			);
			// Now wait on close by deposit
			receiveCommandFromIFrame( "from_iframe_playtoken_uuid", function( response )
				{
					cmobj._hide_iframe();

					if( on_playtoken_obtained != null )
					{
						on_playtoken_obtained( null, response.data['playtoken_uuid'], response );
					}
					// Signal this callback should only be called once.
					return false;
				}
			);
		});
	}



	// Get the rounds for a given game
	// on_close( err, selected_round_id, data )
	this.helper.showRoundSelector = function( on_close )
	{
		// Check that the iframe has loaded before we do this.
		cmobj.when_iframe_loaded( function()
		{
			// Now the iframe has loaded, attempt to grab a playtoken
			cmobj._show_iframe();

			// Send message to ask for a new playtoken.
			var data =
			{
				"game_id":this.game_id,
				"private_rounds_password":"TODO"
			}

			// Now wait on close by deposit
			receiveCommandFromIFrame( "from_iframe_cancelled", function( data )
				{
					cmobj._hide_iframe();

					if( on_close != null )
					{
						on_close( null, data );
					}
					return false
				}
			);
			receiveCommandFromIFrame( "from_iframe_response", function( data )
				{
					// Did we get a round to join?
					var round_id = data['round_id'];
					on_close( null, round_id, data );
					return false
				}
			);

			sendToIFrame( "toiframe_selectround", data );
		});
	}


	// Get the rounds for a given game
	// on_close( err, round_id, round_data )
	this.helper.showCreateRound = function(on_close)
	{
		// Check that the iframe has loaded before we do this.
		cmobj.when_iframe_loaded( function()
		{
			// Now the iframe has loaded, attempt to grab a playtoken
			cmobj._show_iframe();


			// Now wait on close by deposit
			receiveCommandFromIFrame( "from_iframe_cancelled", function( data )
				{
					cmobj._hide_iframe();

					if( on_close != null )
					{
						on_close( null, data );
					}
					return false
				}
			);

			// Now wait on close by deposit
			receiveCommandFromIFrame( "from_iframe_response", function( data )
				{
					cmobj._hide_iframe();

					if( on_close != null )
					{
						var round_id = data['round_id'];
						on_close( null, round_id, data );
					}
					return false
				}
			);

			// Send message to ask for a new playtoken.
			var data =
			{
			}
			sendToIFrame( "toiframe_createround", data );
		});
	}

	// Get the rounds for a given game
	// on_close(err, info);
	this.helper.showResults = function( on_close )
	{
		// Check that the iframe has loaded before we do this.
		cmobj.when_iframe_loaded( function()
		{
			// Now the iframe has loaded, attempt to grab a playtoken
			cmobj._show_iframe();

			// Send message to ask for a new playtoken.
			var data =
			{
				"game_id":this.game_id,
				"private_rounds_password":"TODO"
			}
			sendToIFrame( "toiframe_showresults", data );
			// Now wait on close by deposit
			receiveCommandFromIFrame( "from_iframe_on_close", function( data )
				{
					cmobj._hide_iframe();

					if( on_close != null )
					{
						on_close( null, data );
					}
					return false
				}
			);
		});
	}


	// on_close_deposit( err, info )
	this.helper.showDeposit = function( on_close_deposit )
	{
		// Check that the iframe has loaded before we do this.
		cmobj.when_iframe_loaded( function()
		{
			debug.log("Showing deposit screens started");

			cmobj._show_iframe();

			// Now the iframe has loaded, attempt to grab a playtoken
			// Send message to ask for a new playtoken.
			var data =
			{
				"min_amount":"£5",
				"game_id":this.game_id
			}
			sendToIFrame( "toiframe_depositfunds", data );

			// Now wait on close by deposit
			receiveCommandFromIFrame( "deposit_on_close", function( data )
				{
					cmobj._hide_iframe();

					if( on_close_deposit != null )
					{
						on_close_deposit( null, data );
					}
					return false
				}
			);
		});
	}



	// on_close_deposit( err, info )
	this.helper.sendFunds = function( params, on_close_deposit )
	{
		// Check that the iframe has loaded before we do this.
		cmobj.when_iframe_loaded( function()
		{
			cmobj._show_iframe();

			sendToIFrame( "toiframe_sendfunds", params );

			// Now wait on close by deposit
			receiveCommandFromIFrame( "from_iframe_sendfunds_on_close", function( data )
				{
					cmobj._hide_iframe();

					if( on_close_deposit != null )
					{
						on_close_deposit( null, data );
					}
					return false
				}
			);
		});
	}



		var array_calls =
	[
		"/api/v1/games/round/session/start",
		"/api/v1/games/round/session/stop",
	];



	String.prototype.replaceAll = function(search, replacement) {
		var target = this;
		return target.replace(new RegExp(search, 'g'), replacement);
	};


	// API level
	this.api = {};
	// Replace api/v1/ with api
	var stringitem = array_calls[0];
	stringitem = stringitem.replaceAll( "/api/v1/", "api_" );
	stringitem = stringitem.replaceAll( "/", "_" );
	this.api[ stringitem ] = apicall;

	this.api['v1'] = {};
	this.api['v1']['games'] = {};
	this.api['v1']['games']['round'] = {};
	this.api['v1']['games']['round']['session'] = {};
	this.api['v1']['games']['round']['session']['start'] =  function( params ){ apicall( params ) };

	function apicall( params )
	{
		var fName = arguments.callee.toString().match(/function ([^\(]+)/)[1];


		alert( "This would make a call to :"+call_name );
	}
	// Replace the / with _



	// Preload the iFrame
	this.init = function()
	{
		this._load_iframe();
	}

	this.init();
}
