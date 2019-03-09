// Version 3.0 of the javascript helper integration for CoinMode.
// This helper script is for HTML based games and handles the low level CoinMode API calls necessary to obtain play_tokens to play in games.
// It uses an iFrame approach to keep data hidden from the game itself (such as the private key for the users account)
// Whilst a game may call CoinMode's APIs directly,
// this is intended to make integration incredibly easy by simply initialising the component to load the iframe.coinmode.com into the DOM and sending request messages to this iFrame.
// E.g. A very simply client only game could do this

// cm = new CoinMode( { game_id:((YOUR GAME ID)) } );
// cm.helper.getRoundInfo( round_id, function(err, round_info) );
// cm.helper.getPlayTokenForGame( game_id, play_token, on_complete(err) );
// cm.helper.showRoundSelector( on_close( err, round_id ) );
// cm.helper.joinRound( round_id, passphrase,  function( err, session_token) );
// cm.helper.submitResults( session_token, this.score, extra_json_data,  function( err )
// cm.helper.showResults( round_id, [session_token] );
// cm.helper.shareRound( round_info );

// The iFrame stores account IDs.
// Note that the play_token retrieved by the iFrame is intended to be stored by the CLIENT side local storage not in the iFrame localstorage.

// TODO: Run through build script babel.

var iframe_server_url;


function assert_fn(item) {
    if (typeof (item) != 'function') {
        alert("You have called a CoinMode JS helper method that was expecting a function callback with a non function.  The item found that was not a function is" + item);
    }
} 



/**
 * @description CoinMode constructor.
 * This is the javascript helper library for HTML games to easily integrate CoinMode.
 * The typical process is to initialise CoinMode object with params such as game_id as the HTML game first loads.  This will load an iFrame in the background that this helper file communicates with.
 * Remember it is possible to make CoinMode API calls directly too and this coinmode_helper.js file is merely to simplify the process and keep user data secure.
 * @param params_in This is an object that contains fields to customize how the helper will work.
 * {
 * params.optional.environment - This will change where the iFrame is loaded from and therefore which API environment is used.  Valid options are "production", "staging" or "local"
 * params.optional.suggested_new_display_name - This is if the user doesn't have a CoinMode account it will use this name as a suggestion for their CoinMode display name.  This is because some games may already know who is playing so can provide this information without needing to ask the player again.
 * params.optional.suggested_new_email_name - The default email address to use if the user tries to create a new CoinMode account for themselves.
 * params.optional.referral_code - If using a marketing campaign to recruit new CoinMode users, this will be the referal code associated to the new account.
 * }
 */
function CoinMode(params_in, options) {
    // Variables
    var coinmode_iframe_id = 'coinmode_iframe';
    this.params = params_in;

    // This is to calculate the PoW to demonstrate the client has been running for an expected period of time.
    this.timer_pow = null;
    this.time_started = 0;
    this.minhashint = 0;
    this.minhashstring = '';
    this.conversion_values = { last_updated: 0 };


    if (this.params == null) {
        this.params = {};
        /*
        Callbacks:
        	on_iframe_loaded(err) - Called when the iframe is loaded in
        	on_iframe_visible(err) - Called whenever the iframe is shown
        	on_iframe_hidden(err) - Called when hidden
        */
        alert('Missing params when creating CoinMode Object.  Please make sure you have at least passed in the game_id param');
    }

    // When we init this object, let's try to use the last player used on this client
    if (this.params['player_id'] == null) 
    {
        this.params.player_id = localStorage.getItem("CoinModeLastPlayerId"); // Set the default player we are looking at
    }



    if (this.params.optional == null) {
        this.params.optional = {};
    }
    if (params_in.optional != null) {
        this.params.optional.suggested_new_display_name = params_in.optional['suggested_new_display_name'];
        this.params.optional.suggested_new_email_name = params_in.optional['suggested_new_email_name'];
        this.params.optional.referral_code = params_in.optional['referral_code'];
    }


    // Set the API url to use (production by default).  The iFrame does this same test.
    this.m_coinmode_api_server = "https://api.coinmode.com";
    iframe_server_url = 'https://iframe.coinmode.com';

    if (params_in.optional['environment'] == "staging") {
        this.m_coinmode_api_server = "https://api-staging.coinmode.com";
        iframe_server_url = "https://iframe-staging.coinmode.com";
    }
    else if (params_in.optional['environment'] == "local") {
        this.m_coinmode_api_server = "http://localhost:9000";
        // TODO: Ping the local API if it exists and if not use staging.
        //this.m_coinmode_api_server = "https://api-staging.coinmode.com";
        iframe_server_url = 'http://localhost:8080';
    }
    


    // Helper method to call CoinMode APIs
    // on_complete( error_string, data );
    this.api_call = function (method_name, params, on_complete) {
        assert_fn(on_complete);

        if (method_name.substring(0, 1) != "/") {
            alert("api_call (" + method_name + ") is missing leading / e.g. /rounds/list");
            method_name = "/" + method_name;
        }

        var url = this.m_coinmode_api_server + method_name;
        console.log("Making API call to:" + url);
        console.log("Params");
        console.dir(params);

        // TODO: Should replace jquery with axios or direct calls to save size.
        $.post(url,
            params,
            function (data, status_response) {

                if (data != null) {
                    if (data['status'] == "ok") {
                        return on_complete(null, data);
                    }
                    on_complete("status error", data);
                }
                on_complete(null, data);
            }
        ).fail(function (response) {
            if ((response.status == 0) && (response.statusText == "error")) {
                return on_complete({ error: "Network connection error. Check your internet connection and try again" });
            }
            try {
                console.log(response);
                console.log("Error doing CoinMode API Request:" + method_name + " Error:" + response.responseJSON['error']);
            }
            catch (e) {
                alert("exception:" + e);
                on_complete({ error: "unknown. Dev to look at more" });
            }
            try {
                console.log("Error doing CoinMode API Request:" + method_name + " Error:" + response.responseJSON['error']);
                on_complete(response.responseJSON);
            }
            catch (e) {
                alert("exception:" + e);
                on_complete({ error: "unknown. Dev to look at more" });
            }
        }
        );
    };





    var cmobj = this;

    cmobj._registered_command_callbacks = {}; // This will contain a list of functions to invoke should an input command come in.
    /* E.g.
    	cmobj._registered_command_callbacks['when_done_something'] = [ functioncb1, functioncb2, ... ]
    	user receiveCommandFromIFrame(command, fn)  to append to this.
    */

    // Functions
    // Internal to load the iframe CoinMode launchpad window

    /**
     * This will attempt to find the CoinMode iFrame in the DOM.  If it can't find it the iFrame is loaded.
     * When the iframe has successfully been found a callback is made to the method "on_iframe_loaded(error, cmobj.params)"
     * Possible error values are
     *      "Error interacting with local CoinMode iFrame.  Usually the page didn't load or cross iframe messages are blocked."
     */
    cmobj._load_iframe = function () {
        // Load iFrame with page for game params.game_id
        iframe = document.getElementById(coinmode_iframe_id);
        if (iframe == null) {
            // If we have a game_id set let's try to load the last play_token for this game it exists
            cmobj.m_play_token = cmobj.helper.getLocalStoreplay_token(this.params.game_id, this.params.player_id );

            return this._create_iframe();
        }
        else
        {
            return this._on_iframe_loaded_internal();
        }
    }

    /**
     * INTERNAL
     * This is called to load an iframe into the DOM
     */
    cmobj._create_iframe = function() {
        // Check iframe doesn't already exist
        var iframe = document.createElement('iframe');
        iframe.onload = function (data, data2) {
            cmobj._on_iframe_loaded_internal(data, data2);
        };
        iframe.onerror = function () {
            alert('There was an error loading the iframe');
        };
        iframe.setAttribute('id', coinmode_iframe_id);
        iframe.style.visibility = 'hidden';

        iframe.style.position="absolute";
        iframe.style.top="0px";
        iframe.style.left="0px";
        iframe.style.width="100%";
        iframe.style.height ="100%";


        iframe.src = iframe_server_url;
        iframe.name = 'frame';
        document.body.appendChild(iframe);
        return frames['frame'].location.host;
    }

    /**
     * INTERNAL
     * Called when the iframe is loaded
     */  
    cmobj._on_iframe_loaded_internal = function(data, data2) {
        var methods = cmobj.params['methods'];



        // Listen to message from child window
        _bindEvent(window, 'message', function (e) {
            var data = {};
            var data_raw = e['data'];

            // This is probably unnecessary now since it returns a JSON object not a string but for future proofing
            if (typeof (data_raw) === 'string') {
                console.log('data_raw is text and shows');
                console.log(data_raw);
                try {
                    data = JSON.parse(data_raw);
                } catch (e) {
                    console.log('ERROR: Retrieved a window Message that was not a valid JSON string.');
                    console.log('ERROR Parsing: ' + data_raw);
                    console.log('ERROR: ' + e.data);
                }
            } else {
                // An object was already returned so no parsing needed.
                data = data_raw;
            }
            // Check for any registered responses
            var command = data['command'];
            var array_callbacks_for_command = cmobj._registered_command_callbacks[command];
            if (array_callbacks_for_command != null) {
                for (var i = 0; i < array_callbacks_for_command.length; i++) {
                    var callback = array_callbacks_for_command[i];
                    if (callback != null) {
                        if (callback(data) == false) {
                            // The callback returned false so can be removed safely now
                            array_callbacks_for_command[i] = null;
                        }
                    }
                }
                // Flush out any empty slots
                cmobj._registered_command_callbacks[command] = cmobj._registered_command_callbacks[command].filter(function (e) {
                    return e;
                });
            }
        });

        
        receiveCommandFromIFrame('from_iframe_yes_i_am_alive', function (data) {
            console.log("main window: Yes I've receive a message from the iframe saying I'm alive");
            if (cmobj.timeoutObject != null) {
                clearTimeout(cmobj.timeoutObject);
                cmobj.timeoutObject = null;
            }

            // Flag the the iframe is loaded
            cmobj.iframe_status = 'ready';

            // Yes we know it is alive so can flag it as the iframe has loaded
            if( methods != null )
            {
                if (methods['on_iframe_loaded'] != null) {
                    if (typeof (methods['on_iframe_loaded']) === 'function') {
                        methods['on_iframe_loaded'](null, cmobj.params);
                    } else {
                        cmdebug.error('The on_iframe_loaded is not a function');
                    }
                } else {
                    cmdebug.warning('The on_iframe_loaded callback has not been set in params.method.');
                }
            }
            else {
                cmdebug.warning('There are no methods passed into the params variable.  This means it will be impossible to know when the iFrame has loaded so requires fixing.');
            }
        });

        // An error timeout to call if we don't get a reply from 'I am alive' message
        var timeout_duration_for_iframe_error = 1000;

        // If there was a timeout object from before clear this to ensure we don't get multiple calls.
        if (cmobj['timeoutObject'] != null) {
            clearInterval(cmobj.timeoutObject);
            cmobj.timeoutObject = null;
        }

        cmobj.timeoutObject = setTimeout(function () {
            alert('There has been an error loading the iframe');
            if (methods['on_iframe_loaded'] != null) {
                if (typeof (methods['on_iframe_loaded']) === 'function') {
                    methods['on_iframe_loaded']("Error interacting with local CoinMode iFrame.  Usually the page didn't load or cross iframe messages are blocked.", cmobj.params);
                }
            }
        }, timeout_duration_for_iframe_error);

        // Send a ping message to see if it's loaded, if we don't receive the reply we know it failed to load correctly or messages are blocked.. either way we need to abort at this stage
        var environment = "production";
        if (cmobj.params.optional['environment']) {
            environment = cmobj.params.optional['environment'];
        }
        sendToIFrame('to_iframe_are_you_alive',
            {
                game_id : cmobj.params['game_id'],
                environment: environment
            });
    }

    /**
     * INTERNAL
     * If we ever need to unload an iframe to save memory you can call this method.
     */
    this._unload_iframe = function () {
        //document.getElementById(coinmode_iframe_id).remove();
        var element = document.getElementById(coinmode_iframe_id);
        element.parentNode.removeChild(element);
        this.iframe_status = 'none';
    };


    /**
     * INTERNAL
     * To make the iFrame visible to the user in the browser
     */
    cmobj._show_iframe = function () {
        var iframe = document.getElementById(coinmode_iframe_id);
        if (iframe) {
            iframe.style.visibility = 'visible';
            this.iframe_visible = true;
        } else {
            cmdebug.log('No iframe found to show in _show_iframe');
        }
        if (typeof (this.params.on_iframe_visible) === 'function') {
            // Call the callback
            this.params.on_iframe_visible();
        }
    };


    /**
     * INTERNAL
     * To hide the iFrame from the user
     */
    cmobj._hide_iframe = function () {
        var iframe = document.getElementById(coinmode_iframe_id);
        if (iframe) {
            document.getElementById(coinmode_iframe_id).style.visibility = 'hidden';
            this.iframe_visible = false;
        } else {
            cmdebug.log('No iframe found to hide in _hide_iframe');
        }
        if (typeof (this.params.on_iframe_hidden) === 'function') {
            // Call the callback
            this.params.on_iframe_hidden();
        }
    };

    
    /**
     * TEST CODE
     */
    var sendToIFrameAndWaitForReponse = function (command, msg, callback) {
        /* Wait for the event for when the iframe is closed.  This should contain a message of
        {
        	command : "new_round",
        	data: {blob of useful data}
        	error : "reason for error"
        }
        */

        sendToIFrame(command, msg);
    };

    // Hide the iframe
    // parent.document.getElementById('myframeId').style.display='none'

    
    /**
     * Send a message to the CoinMode iFrame
     * @param {*} command - The command the iFrame understands.  These are typically routing commands to show various screens or instigate an action.
     * @param {*} msg - This is typically a JSON object that the iFrame will decode and do something with.  
     */
    var sendToIFrame = function (command, msg) {
        var data_package = {
            'command': command,
            'version': 1.0,
            'data': msg
        };
        var data_to_send = JSON.stringify(data_package);
        // Make sure you are sending a string, and to stringify JSON
        var iframeEl = document.getElementById(coinmode_iframe_id);
        if (iframeEl != null) {
            iframeEl.contentWindow.postMessage(data_to_send, '*');
        } else {
            cmdebug.error('Unable to find iframe named:' + coinmode_iframe_id);
        }
    };


    /**
     * INTERNAL
     * Register for events sent from the iFrame back to this helper client
     * This is used to typically get the response from some user interaction, e.g. when a play_token has been requested, the play_token is returned via these events.
     * @param {} element 
     * @param {*} eventName 
     * @param {*} eventHandler 
     */
    function _bindEvent(element, eventName, eventHandler) {
        assert_fn(eventHandler);

        if (element.addEventListener) {
            element.addEventListener(eventName, eventHandler, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + eventName, eventHandler);
        }
    }


    /**
     * Typically used by this helper module to register for events from the iFrame we are interested in hearing about.
     * @param {*} command - The command from the CoinMode iFrame to listen for
     * @param {*} callback  The function to call when this is found.
     */
    function receiveCommandFromIFrame(command, callback) {
        assert_fn(callback);

        if (cmobj._registered_command_callbacks[command] == null) {
            cmobj._registered_command_callbacks[command] = [];
        }
        cmobj._registered_command_callbacks[command].push(callback);
        cmdebug.log('SR: cmobj._registered_command_callbacks[command].length:' + cmobj._registered_command_callbacks[command].length);
    }


    /**
     * Clear any registered commands we might be listening for.  This is typically to be used internally and called before each time a new iFrame route is given
     * @param {*} command 
     */
    function clearCommandFromIFrame(command) {
        if (cmobj._registered_command_callbacks == null) {
            cmobj._registered_command_callbacks = {};
        }
        cmobj._registered_command_callbacks[command] = [];
    }



    
    cmobj.when_iframe_loaded = function (on_loaded, params) {
        assert_fn(on_loaded);

        if (cmobj.iframe_status != 'ready') {
            var callee = 'Unknown';
            try {
                callee = arguments.callee.caller.name;
            } catch (e) {
                cmdebug.warning('Unable find the name of the function that was called before the CoinMode iFrame was ready.  Place a breakpoint here to discover it if necessary');
            }

            cmdebug.warning('Attempting to call helper API (' + callee + ') before the iFrame is loaded.  Please call init first with params.methods.on_iframe_loaded set so you know when the iframe has successfully loaded or failed to load');

            // We therefore can wait for the iframe to be ready and continue
            receiveCommandFromIFrame('from_iframe_yes_i_am_alive', function () {
                try {
                    if (typeof (on_loaded) === 'function') {
                        return on_loaded(params);
                    } else {
                        cmdebug.error('There was no callback function given for when_iframe_loaded test');
                    }
                } catch (e) {
                    cmdebug.error('There was an error in the callback given to when_iframe_loaded');
                    console.log(e);
                }
            });
            return;
        }
        else {
            // We already loaded the iframe so call the on_loaded method immediately
            try {
                if (typeof (on_loaded) === 'function') {
                    return on_loaded(params);
                } else {
                    cmdebug.error('There was no callback function given for when_iframe_loaded test');
                }
            } catch (e) {
                cmdebug.error('There was an error in the callback given to when_iframe_loaded');
                console.log(e);
            }
        }
    };


//----------------------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------------------------


    /**
     * The helper section are useful simple calls to make that communicate to the iFrame to do common actions required by games.
     * E.g. Show a deposit funds screen or ask the user to grant access to playing this game.
     */
    this.helper = {};


    /**
     * on_complete - function( err, formatted_text, raw_value )
     */
    this.helper.convert = function( source_currency, source_amount, destination_currency, use_postfix, on_complete)
    {
        assert_fn( on_complete );
        var destination_value = source_amount;
        var conversion = 3600;
        if( cmobj.conversion_values != null )
        {
            // Check destination currency is known
            var array_currencies = Object.keys( cmobj.conversion_values );
console.log(cmobj.conversion_values);
            // If the source currency was bitcoin_test/bitcoin_main, change amount to be satoshis
            if( ( source_currency == "bitcoin_test" ) || 
                ( source_currency == "bitcoin_main" ) )
            {
                source_currency = "satoshis";
            }
            // Check if we need to convert the source amount
            if( array_currencies.indexOf( source_currency ) >= 0 )
            {
                var src_obj = cmobj.conversion_values[source_currency];
    
                console.log("source_currency");
                console.log(source_currency);
                console.log(src_obj);

                // Yes we've found the source currency so convert it to satoshis
                source_amount = source_amount * src_obj['satoshi_rate']; 
            }


            // Do we know the destination currency?
            if( array_currencies.indexOf( destination_currency ) >= 0 )
            {
                // Yes we found a conversion
                var destcur = cmobj.conversion_values[ destination_currency ];
                conversion = destcur['satoshi_rate'];

                destination_value = source_amount / conversion;
                var rounded = destcur['rounded'];
                if( isNaN( rounded ) )
                {
                    rounded = 2;
                }
                var destination_value_round = destination_value.toFixed( rounded );
                destination_text = destcur['prefix'] + destination_value_round;
                if( use_postfix )
                {
                    destination_text += destcur['postfix'];
                }
        
                return on_complete( null, destination_text, destination_value, destination_value_round, destcur ); 
            } 
            else
            {
                // Currency not found
                console.log("Valid currencies found:");
                console.log( array_currencies );
                alert( "The requested currency has no conversion rate in sync data. Trying to find:"+destination_currency );
            }
        }
        else
        {
            alert("Conversion rates haven't been synchronised yet");
        }

        on_complete( null,  "(waiting)", 0, "(waiting)", {} ); 
    }

    /**
     * Get the game information
     * @param game_id - The game_id to interogate.
     * @callback on_complete( err, gameInfo ) - Returns information about the game 
     */
    this.helper.getGameInfo = function( game_id, on_complete ) {
        var data = {
            game_id: game_id
        };
        assert_fn(on_complete);

        cmobj.api_call("/v1/games/get_info", data, function (err, results) {
            if( err )
            {
                return err;
            }
            var game_details = results['game_details'];
            console.log("Results of game info");
            console.log(results);
            if (game_details['currency'] == null )
            {
                game_details['currency'] = "bitcoin_test";
                alert("There was no currency set for game:" + cmobj.params.game_id + " via API call to " + cmobj.m_coinmode_api_server );
            }

            

            
            on_complete(err, results);
        });
    }



    /**
     * Get the game information
     * @param game_id - The game_id to interogate.
     * @callback on_complete( err, gameInfo ) - Returns information about the game 
     */
    this.helper.getPlayerInfo = function( play_token, on_complete ) {
        var data = {
            play_token: play_token
        };
        assert_fn(on_complete);

        cmobj.api_call("/v1/players/get_properties", data, function (err, results) {
            if( err )
            {
                return err;
            }
            console.log( results );
            
            on_complete(err, results);
        });
    }



    /**
     * Get the game information
     * @param round_id - The round_id as returned by create round or select round.
     * @callback on_complete( err, gameInfo ) - Returns information about the game 
     */
    this.helper.getRoundInfo = function (round_id, on_complete) {
        assert_fn(on_complete);
        if( ( round_id == null ) || 
            ( round_id == "" ) || 
            ( round_id == 0 ) )
        {
            return on_complete( "missing round_id" );
        }
        var data = {
            round_id: round_id
        };
        cmobj.api_call("/v1/games/round/get_info", data, function (err, results) {
            console.log("Results of game info");
            console.log(results);
            on_complete(err, results);
        });
    }



    /**
     * This will obtain a play_token for a given player and this game.
     * @param game_id - The game_id to interogate.
     * @callback on_play_token_obtained( err, play_token, details ) - Function to be called with the result
     */
    this.helper.getPlayTokenForGame = function (game_id, on_play_token_obtained) {
        assert_fn(on_play_token_obtained);

        // Attempt to get the play_token in localstorage.  
        var play_token = cmobj.helper.getLocalStoreplay_token( game_id, cmobj.params.player_id);
        if( play_token != null )
        {
            cmobj.m_play_token = play_token;
            return on_play_token_obtained( null, cmobj.m_play_token );
        }

        // Check that the iframe has loaded before we do this.
        cmobj.when_iframe_loaded(function () {
            // Do we have an existing play_token?  If so, is it still valid to use or do we need to refresh it?
            // TODO: Check existing play_token

            // Now the iframe has loaded, attempt to grab a play_token
            // Send message to ask for a new play_token.
            var data = {
                'game_id': game_id
                // "hint_displayname":this.params.optional['suggested_new_display_name'], /* This is if the player clicks CreateNew it will default to this as their default name */
                // "hint_email":this.params.optional['suggested_new_email_name'], /* For new player, this will offer a default email address for them to use */
                // "referral_code":this.params.optional['referral_code'], /* Any campaign referral code if given */
            };

            // Now wait on close by deposit
            receiveCommandFromIFrame('show_iframe', function (data) {
                cmobj._show_iframe();
                return false;
            });
            receiveCommandFromIFrame('from_iframe_cancelled', function (data) {
                console.log('The user denied access');
                cmobj._hide_iframe();
                on_play_token_obtained('Denied', null, data);
                return false;
            });
            // Now wait on close by deposit
            receiveCommandFromIFrame('from_iframe_completed', function (response) {
                cmobj._hide_iframe();

                if (on_play_token_obtained != null) {
                    cmobj.m_play_token = response.data['play_token'];

                    // We want to associate this play_token to the game/account ID.
                    cmobj.helper.setLocalStoreplay_token(cmobj.params.game_id, cmobj.params.player_id, cmobj.m_play_token);

                    on_play_token_obtained(null, response.data['play_token'], response);
                }
                // Signal this callback should only be called once.
                return false;
            });
            cmobj._show_iframe();
            sendToIFrame('toiframe_playtokenrequest', data);

        });
    };


    /**
     * This allows you to change player and gets a new playtoken based on this player
     * @callback on_play_token_obtained( err, play_token, details ) - Function to be called with the result
     */
    this.helper.changePlayer = function (game_id, on_play_token_obtained) {
        assert_fn(on_play_token_obtained);

        // Check that the iframe has loaded before we do this.
        cmobj.when_iframe_loaded(function () {
            var data = {
            };
            cmobj._show_iframe();

            // Now wait on close by deposit
            receiveCommandFromIFrame('show_iframe', function (data) {
                cmobj._show_iframe();
                return false;
            });
            receiveCommandFromIFrame('from_iframe_cancelled', function (data) {
                console.log('The user denied access');
                cmobj._hide_iframe();
                on_play_token_obtained('Denied', null, data);
                return false;
            });
            // Now wait on close by deposit
            receiveCommandFromIFrame('from_iframe_completed', function (response) {
                cmobj._hide_iframe();

                cmobj.m_play_token = response.data['play_token'];
                
                // We want to associate this play_token to the game/account ID.
                cmobj.helper.setLocalStoreplay_token(cmobj.params.game_id, cmobj.params.player_id, cmobj.m_play_token);
                
                if (on_play_token_obtained != null) {
                    on_play_token_obtained(null, response.data['play_token'], response);
                }
                // Signal this callback should only be called once.
                return false;
            });
            sendToIFrame('toiframe_selectaccount', data);
        });
    };


    /**
     * This is used to save the latest play_token to use for a given game.  
     * @param game_id - The game_id to interogate.
     * @param player_id - The player_id we want to add a play_token for
     * @param play_token - The play_token that was supplied, perhaps via a GET referal link
     * @callback on_complete( err, gameInfo ) - Returns information about the game 
     */
    this.helper.setPlayTokenForGame = function (game_id, player_id, play_token, on_complete)
    {
        assert_fn( on_complete );

        // Send the latest play_token to the iframe so subsequent calls use it.

        // Check there is no play_token already set, if there is let's remove it.
        var old_play_token = this.helper.getLocalStoreplay_token(game_id, player_id);
        if (old_play_token != null) {
            cmobj.helper.setLocalStoreplay_token(game_id, player_id, null );
            cmobj.api_call("/v1/players/play_tokens/cancel",
                {
                    play_token: old_play_token,
                }, function (err, result) {
                    if (err) {
                        console.log("There was an error while cancelling an old play_token");
                        console.log(err);
                    }
                    else {
                        // Cancelled old play_token correctly.
                    }
                    cmobj.helper.setLocalStoreplay_token(game_id, player_id, play_token );

                    on_complete( err, play_token );
                }
            );
        }
        else
        {
            on_complete(err, play_token);
        }
    }



    this.helper.setLocalStoreplay_token = function(game_id, player_id, play_token)
    {
        var key = "COINMODE_" + game_id + "_" + player_id;

        // Save this player_id so next time we do a new cm_init for this game we know who the last player and play_token were that we used.
        localStorage.setItem("CoinModeLastPlayerId", player_id);

        if( play_token == null )
        {
            localStorage.setItem(key, null);
            window.localStorage.removeItem(key);
            return true;
        }
        else
        {
            localStorage.setItem(key, play_token);
            return true;
        }
    }


    this.helper.getLocalStoreplay_token = function(game_id, player_id)
    {
        try{
        var key = "COINMODE_" + game_id + "_" + player_id;
        var play_token = localStorage.getItem(key);
        return play_token;
        }
        catch(e)
        {           
            console.log("No play_token found for the game_id:"+game_id); 
        }
        return null;
    }


    /**
     * Find the first round and join it for a given game.  This will also log the player in if required.
     * 
     * @param game_id - The game_id to interogate.
     * @callback on_complete(err, round_id, round_info, session_token, session_info ) - Returns information about the round just joined
     */
    this.helper.joinFirstRound = function ( game_id, passphrase, on_complete) {
        assert_fn(on_complete);
        var that = this;

        if( this.play_token == null )
        {
            // Get playerinfo
            that.getPlayerInfo( this.play_token, function( err, player_info )
            {
                if( err )
                {
                    alert( "Unable to get player info for this playtoken:"+this.play_token );
                    return on_complete( err );
                }
                // Call get play_token
                that.getPlayTokenForGame(game_id, function( err, play_token ) {            
                    if( err )
                    {
                        alert( err );
                        return on_complete(err);
                    }
                    that.play_token = play_token;
                    console.log("Found play_token:"+that.play_token );
                    that.joinFirstRoundWithPlaytoken( game_id, play_token, player_info, passphrase, on_complete );
                });
            });
        }
        else
        {
            that.joinFirstRoundWithPlaytoken( game_id, that.play_token, player_info, passphrase, on_complete );
        }
    }



    /**
     * When given a play_token we can attempt to join the first round of a game automatically.
     * on_complete( err, play_token, round_id, round_info, session_token, session_info )
     */
    this.helper.joinFirstRoundWithPlaytoken = function( game_id, play_token, player_info, passphrase, on_complete )
    {
        assert_fn(on_complete);
        var that=this;
        
        var data = {
            game_id: game_id,
            passphrase : passphrase,
            include_ready_to_join: true,
            limit:3
        };
        
        // We need to find a list of all the rounds for this game.  Once we find the rounds, if there is only one active round join that immediately.
        cmobj.api_call("/v1/games/round/list", data, function (err, results) {
            if( err )
            {
                return on_complete( "Unable to get rounds");
            }
            console.log(results);
            var rounds = results['rounds'];
            console.log("Results of game info");
            console.log(rounds);

            var round_info = null;
            if (rounds.length > 0 )
            {
                // Filter out any rounds that are not in the 'waiting_to_play'=1 or 'playing' status
                round_info = rounds[0];
                if( rounds.length > 1 )
                {
                    alert("More than one round to select from, picking first round");
                    // return on_complete("More than one round to select from");
                }
            }
            else
            {
                return on_complete("No rounds found");
            }
            that.round_id = round_info['round_id'];

            that.joinRound(that.round_id, that.passphrase, play_token, 
                function(err, session_token, session_info)
                {
                    on_complete( err, play_token, player_info, that.round_id, round_info, session_token, session_info );
                });
        });
    }



    /**
     * Displays a round selector for a given game
     * @param game_id - The game_id to interogate.
     * @callback on_complete( err, round_id, roundInfo ) - Returns information about the round selected
     */
    this.helper.showRoundSelector = function ( game_id, on_complete) {
        var data = {
            game_id: game_id
        };
        assert_fn(on_complete);

        // Check that the iframe has loaded before we do this.
        cmobj.when_iframe_loaded(function () {
            // Now the iframe has loaded, attempt to grab a play_token
            cmobj._show_iframe();

            // Now wait on close by deposit
            receiveCommandFromIFrame('from_iframe_cancelled', function (result) {
                cmobj._hide_iframe();

                if (on_complete != null) 
                {
                    on_complete("cancelled");
                }
                return false;
            });
            receiveCommandFromIFrame('from_iframe_completed', function (result) {
                cmobj._hide_iframe();

                // Did we get a round to join?
                // var round_id = round_info['round_id'];
                if (on_complete) {
                    var round_info = result['data'];
                    var round_id = round_info['round_id'];
                    if( round_id == null )
                    {
                        round_id = round_info['id_round']; // Legacy support
                    }
                    on_complete(null, round_id, round_info);
                }
                return false;
            });

            sendToIFrame('toiframe_selectround', data);
        });
    };



    // Get the rounds for a given game
    // on_close( err, round_id, round_data )
    /**
     * Allows the user to create a new round
     * @param game_id - The game_id to interogate.
     * @param play_token - The play_token obtained earlier to allow us to create a round of this game.  Not all games allow rounds to be created by the user, this depends on the flags set in the portal.
     * @callback on_complete( err, round_id, roundInfo ) - Returns information about the round created
     */
    this.helper.showCreateRound = function ( game_id, play_token, on_close) {
        var data = {
            game_id: game_id,
            play_token : play_token
        };
        assert_fn(on_close);

        // Check that the iframe has loaded before we do this.
        cmobj.when_iframe_loaded(function () {
            // Now the iframe has loaded, attempt to grab a play_token
            cmobj._show_iframe();

            // Now wait on close by deposit
            receiveCommandFromIFrame('from_iframe_cancelled', function (data) {
                cmobj._hide_iframe();
                if( data['error'] != null )
                {
                    return on_close( data['error'] );
                }

                if (on_close != null) {
                    on_close(null, data);
                }
                return false;
            });

            // Now wait on close by deposit
            receiveCommandFromIFrame('from_iframe_completed', function (result) {
                var round_info = result['data'];
                console.log('SR: in coinmode_helper.js received response from iframe for round selected');
                console.log(round_info);
                cmobj._hide_iframe();

                // Did we get a round to join?
                if (on_close) 
                {
                    var round_id = round_info['round_id'];
                    on_close(null, round_id, round_info);
                }
                return false;
            });

            // Send message to ask for a new play_token.
            alert("Sending play_token:"+data.play_token );
            sendToIFrame('toiframe_createround', data);
        });
    };

    // Get the rounds for a given game
    // round_id - This can either be the round_info object or the actual round_id
    // on_close( err, selected_round_id, data )
    /**
     * @param play_token - The play_token obtained earlier to allow access to a player's balance.
     * @description This gets the balance of the current player
     *     err could be one of these ["no round found"]
     */
    this.helper.getBalances = function (play_token, on_close) {
        assert_fn(on_close);

        cmobj.api_call("/v1/players/wallet/get_balances",
            {
                play_token: play_token,
            }, function (err, result) {
                on_close(err, result);
            }
        );
    };

    // Get the rounds for a given game
    // round_id - This can either be the round_info object or the actual round_id
    // on_close( err, selected_round_id, data )
    /**
     * @description This is a helper to call the session/request API call to join a previously selected round
     * @param round_id The round Identifier as returned by select round or create round calls.
     * @param passphrase This is the optional password to join a round.
     * @param on_complete( err, session_token, session_info ) This function is called when completed
     * 
     * { 
  session_token: 'st_IxENXMjfV0g',
  round_id: 510,
  game_id: 33,
  round_name: 'autotest',
  fee_play_session: 0,
  pot_contribution: 500,
  id_round: 748
}
     *     err could be one of these ["no round found"]
     */
    this.helper.joinRound = function (round_id, passphrase, play_token, on_close) {
        assert_fn(on_close);

        /*
        sendToIFrame('toiframe_join_round', round_id);
        // Just check the round_info object hasn't been passed in.
        if (typeof (round_id) == 'object') {
            round_id = round_id['round_id'];
        }
        */

        cmobj.api_call("/v1/games/round/session/request",
            {
                play_token: play_token,
                round_id: round_id,
                passphrase: passphrase
            }, function (err, result) {
                // Simple API call to join the round


                /*
                    // This is to calculate some proof of work that we have been playing for the time reported
                    if (this.timer_pow != null) {
                        clearInterval(this.timer_pow);
                        this.timer_pow = null;
                    }
                    this.time_started = new Date().getTime();
                    var that = this;
                    var minhashint = 0;
                    this.timer_pow = setInterval(function () {
                        a = Math.random();
                        that.minhashstring = round_id.toString() + a.toString();
                        var hashstring = sha256(that.minhashstring);
                        var hashint = parseInt(hashstring.substring(0, 64), 16);
                        if ((hashint < minhashint) ||
                            (that.minhashint == 0)) {
                            that.minhashint = hashint;
                            that.minhashstring = a;
                        }
                    }, 1000);
                */
                console.log("result on session/request");
                console.log( result );
                var session_token = result['session_token'];
                if( err )
                {
                    console.log(err);
                    alert("There was an error joining this round:"+err );
                }
                else
                {
                    cmobj.time_started = new Date().getTime();
                }
                on_close(err, session_token, result);
            }
        );
    };


    /**
     * @description This is used to submit the players score from the client to CoinMode.  Typically this step is normally done on a game server by calling session/stop directly but is offered here in helpers where a players score trust is allowed.  E.g. playing between friends who trust each other or no prize or anti-cheat verification can be done. 
	 * @param session_token - The token as returned by joining a round for this player
	 * @param score - A 32bit positive integer value whereby the highest value typically wins the round
	 * @param extra_json_data - This is a JSON structure you can interpret in the CoinMode dash board.  E.g. { completed_time:1393.2,  coins_collected:500 }
	 * @param temporary_verification_data - This data is submitted to verify the result to your optional game server/logic.  We only retain this data to verify the result.
     * @param on_close(err, info);
    		possible err values -
    			"Invalid JSON in extra_json_data"
     */
    // Get the rounds for a given game
    // @param
    this.helper.submitResults = function ( session_token, score, extra_json_data, on_complete) {
        assert_fn(on_complete);

        var results = {};

        // This can actually be calculated between start and submit results but submitting it for reference anyhow
        var timedelta = new Date().getTime() - cmobj.time_started;

        var session_data = {
            'score': score,
            //'pow': this.minhashint,
            //'auth': this.minhashstring,
            //'duration': timedelta
        };;

        // Copy in the extra data if needed.
        if (extra_json_data != null) {
            if (typeof (extra_json_data) === 'object') {
                var array_keys = Object.keys(extra_json_data);
                for (var i = 0; i < array_keys.length; i++) {
                    var key = array_keys[i];
                    session_data[key] = extra_json_data[key];
                }
            } else {
                console.log('The extra_json_data is not a valid JSON object, results are not being submitted');
                return (on_complete('Invalid JSON in extra_json_data'));
            }
        }


        results[session_token] = session_data;
        
        
        // Attempt an API call to submit the results.
        cmobj.api_call("/v1/games/round/session/stop", {results : JSON.stringify( results ) }, function (err, results) {
            if( err )
            {
                return on_complete( err );
            }
            console.log( results );
            
            if (on_complete != null) {
                return on_complete(null, results);
            }
        });
    };

    // Get the rounds for a given game
    // on_close(err, info);
    this.helper.showResults = function (round_id, session_token, on_close) {
        assert_fn(on_close);

        // Check that the iframe has loaded before we do this.
        cmobj.when_iframe_loaded(function () {
            // Now the iframe has loaded, attempt to grab a play_token
            cmobj._show_iframe();

            // Send message to ask for a new play_token.
            var data = {
                'round_id': round_id,
                'session_token': session_token
            };
            sendToIFrame('toiframe_showresults', data);
            // Now wait on close by deposit
            receiveCommandFromIFrame('from_iframe_completed', function (data) {
                cmobj._hide_iframe();

                if (on_close != null) {
                    on_close(null, data);
                }
                return false;
            });
        });
    };

    // on_close_deposit( err, info )
    this.helper.showDeposit = function (play_token, on_close) {
        assert_fn(on_close);

        // Check that the iframe has loaded before we do this.
        cmobj.when_iframe_loaded(function () {
            cmdebug.log('Showing deposit screens started');

            cmobj._show_iframe();

            // Now the iframe has loaded, attempt to grab a play_token
            // Send message to ask for a new play_token.
            var data = {
                'min_amount': '£5',
                'play_token':play_token,
                'game_id': "NOTUSED"
            };
            
            // Now wait on close by deposit
            receiveCommandFromIFrame('deposit_on_close', function (data) {
                cmobj._hide_iframe();
                
                if (on_close != null) {
                    on_close(null, data);
                }
                return false;
            });

            sendToIFrame('toiframe_depositfunds', data);
        });
    };

    // on_close( err )
    this.helper.shareRound = function (round_info, on_close) {
        assert_fn(on_close);
        // Check that the iframe has loaded before we do this.
        cmobj.when_iframe_loaded(function () {
            cmdebug.log('Showing share screen');

            cmobj._show_iframe();

            // Now the iframe has loaded, attempt to grab a play_token
            // Send message to ask for a new play_token.
            var data = {
                hide_shares: ['pinterest'],
                round_info: round_info
            };
            // Now wait on close by deposit
            receiveCommandFromIFrame('from_iframe_cancelled', function (data) {
                cmobj._hide_iframe();

                if (on_close != null) {
                    on_close(null);
                }
                return false;
            });
            sendToIFrame('toiframe_shareround', data);
        });
    };

    // on_close_deposit( err, info )
    this.helper.sendFunds = function ( play_token, params, on_close_deposit) {
        assert_fn( on_close_deposit );
        // Check that the iframe has loaded before we do this.
        cmobj.when_iframe_loaded(function () {
            cmobj._show_iframe();

            sendToIFrame('toiframe_sendfunds', params);

            // Now wait on close by deposit
            receiveCommandFromIFrame('from_iframe_completed', function (data) {
                cmobj._hide_iframe();

                if (on_close_deposit != null) {
                    on_close_deposit(null, data);
                }
                return false;
            });
        });
    };


    /**
     *
     * {
    "gbp": {
        "satoshis": 1,
        "prefix": "£",
        "rounded": 2,
        "postfix": "(GBP)",
        "satoshi_rate": 35713.010249633946,
        "amount": 0,
        "amount_raw": 0.000028000999999999995,
        "text_raw": "0.00",
        "text": "£0.00(GBP)"
    },
    "usd": {
        "satoshis": 1,
        "prefix": "$",
        "rounded": 2,
        "postfix": "(USD)",
        "satoshi_rate": 27692.929718113668,
        "amount": 0,
        "amount_raw": 0.0000361103,
        "text_raw": "0.00",
        "text": "$0.00(USD)"
    },
    "eur": {
        "satoshis": 1,
        ...
      
     */
    this.helper.syncConversionRates = function( on_complete )
    {
        var data = {
            value : 1
        };
        cmobj.api_call("/v1/info/convert_value", data, function (err, results) {
            if( err )
            {
                return err;
            }

            results['last_updated'] = new Date().getTime() / 1000;
            cmobj.conversion_values = results;
            console.log("Obtained conversion rates");
            console.log(results);
            if( on_complete )
            {
                on_complete( null, results );
            }
        });
    };

    
    this.helper.api_faucet = function ( player_id, amount, currency_type, on_complete )
    {
        var url = "https://faucet.coinmode.com/v1/get";
        
        if( window.location.href.indexOf( "staging" ) >=0 )
        {
            url = "https://faucet-staging.coinmode.com/v1/get";
        }

        var params =
        {
            player_id : player_id,
            amount : amount,
            currency_type : currency_type
        }
        // TODO: Should replace jquery with axios or direct calls to save size.
        $.get(url,
            params,
            function (data, status_response) {

                if (data != null) {
                    if (data['status'] == "ok") {
                        return on_complete(null, data);
                    }
                    on_complete("status error", data);
                }
                on_complete(null, data);
            }
        ).fail(function (response) {
            if ((response.status == 0) && (response.statusText == "error")) {
                return on_complete({ error: "Network connection error. Check your internet connection and try again" });
            }
            try {
                console.log(response);
                console.log("Error asking faucet for funds Error:" + response.responseJSON['error']);
            }
            catch (e) {
                alert("exception in faucet:" + e);
                on_complete({ error: "unknown. Dev to look at more" });
            }
            try {
                on_complete(response.responseJSON);
            }
            catch (e) {
                alert("exception doing callback from faucet call:" + e);
            }
        });
    };


    // Preload the iFrame
    this.init = function () {
        // Get conversion amounts

        this.helper.syncConversionRates( function( err, result )
        {
            this._load_iframe();
        }.bind(this));
    };

    this.destroy = function()
    {
        this._unload_iframe();
        this.cmobj = null;
    }

    this.init();
}




var cmdebug =
{
    log: function (text) {
        console.log("CoinMode:" + text);
    },
    warning: function (text) {
        console.log("!CoinMode:" + text);
    },
    error: function (text) {
        console.log("ERROR CoinMode:" + text);
    }
}

