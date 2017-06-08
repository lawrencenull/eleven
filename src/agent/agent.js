import Eleven from '../core';
import SpeechRecognition from '../speech/speechRecognition';
import { document } from '../common/document';
import { each } from '../common/helpers';

// buffer restarts
var lastStartTime = 0, restartCount = 0;

Eleven.fn.extend({
  /**
   * Iterates over a collection of objects
   * @param {Mixed}    collection Collection to iterate over
   * @param {Function} fn         Callback function
   */
  error(event){
    const { error } = event;

    if(typeof(this.options.onError) === 'function'){
      this.options.onError(error, event);
    }

    if(error === 'network' || error === 'not allowed' || error === 'service-not-allowed'){
      this.options.autoRestart = false;
    }

    if(this.options.debug){
      console.warn(`[Eleven] SpeechRecognition event error: ${error} \n ${JSON.stringify(event, null, 2)}`);
    }
  },
  /**
   * Initializes the SpeechRecognition API, adds commands and binds event
   * listeners. To avoid overlap with other tabs listening we used the
   * `pagevisibility` API to abort the inactive tab instance.
   * @return {Object} Eleven instance
   */
  enable(){
    const options = this.options;
    // reference to SpeechRecognition instance
    this.recognition = new SpeechRecognition();
    // set language
    this.recognition.lang = options.language;
    // set max alternative results
    this.recognition.maxAlternatives = options.maxAlternatives;
    // set continuous listening
    this.recognition.continuous = options.continuous;
    // return results immediately so we can emulate audio waves
    this.recognition.interimResults = options.interimResults;
    // if true, this will pass all speech back to the onCommand callback
    if(options.useEngine){
      this.addCommands('eleven', {
        '*msg': options.onCommand
      });
    }
    // add commands
    this.addCommands('eleven', {
      'stop': () => {
        this.stop();

        setTimeout(() => Eleven.resetView(() => document.body.classList.remove('interactive')), 500);

        if(typeof(options.onStop) === 'function'){
          this.context = null;
          options.onStop.call(this);
        }
      }
    });
    // load user defined commands
    if(options.commands){
      this.addCommands('eleven', options.commands);
    }
    // check if wake commands exist. if so, create regexp to strip from speech matches
    if(options.wakeCommands.length){
      Eleven.regexp.wakeCommands = new RegExp(`^(${options.wakeCommands.join('|')})\\s+`, 'i');
    }
    // setup all SpeechRecognition event listeners
    this.listeners();
    // fire activation event
    if(typeof(options.onActivate) === 'function'){
      options.onActivate.call(this);
    }

    this.start();

    return this;
  },
  /**
   * Binds callback functions to SpeechRecognition API
   * events `onstart`, `onerror`, `onresult`, etc...
   */
  listeners(){
    this.recognition.onend = () => this.stop(true);
    this.recognition.onerror = (error) => this.error(error);
    this.recognition.onresult = (result) => this.result(result);
    this.recognition.onstart = () => this.start();
    this.recognition.onaudioend = () => this.stop();
    this.recognition.onaudiostart = () => {
      if(typeof(this.options.onStart) === 'function'){
        this.options.onStart.call(this);
      }
    };

    document.addEventListener('visibilitychange', () => {
      if(document.hidden){
        if(this.recognition && this.recognition.abort){
          if(this.debug){
            console.debug('[Eleven] User switched to another tab - disabling listeners.');
          }

          this.stop();
          this.recognition.abort();
        }
      }else{
        if(this.options.autoRestart){
          this.restart();
        }
      }
    });
  },

  restart(){
    const timeSinceLastStart = new Date().getTime() - lastStartTime;

    restartCount += 1;

    if(restartCount % 10 === 0){
      if(this.options.debug){
        console.debug('[Eleven] Speech Recognition is repeatedly stopping and starting.');
      }
    }

    if(timeSinceLastStart < 1000){
      setTimeout(() => {
        this.start();
      }, 1000 - timeSinceLastStart);
    }else{
      this.start();
    }
  },

  start(){
    this.listening = true;

    lastStartTime = new Date().getTime();

    try {
      this.recognition.start();
    }catch(e){
      if(this.options.debug){
        console.warn(`[Eleven] Error trying to start SpeechRecognition: ${e.message}`);
      }
    }

    return this;
  },

  stop(restart){
    if(this.visualizer){
      this.running = false;
      this.visualizer.stop();
      this.container.classList.remove('ready');
    }

    if(typeof(this.options.onEnd) === 'function'){
      this.options.onEnd.call(this);
    }

    if(restart && this.options.autoRestart){
      this.restart();
    }

    return this;
  }
});

Eleven.extend(Eleven, {
  /**
   * Removes all rendered elements from the viewport and executes a callback
   * @param  {Function} fn Function to execute once the view has been cleared
   */
  resetView(selector = '.results', fn){
    if(typeof(selector) === 'function'){
      fn = selector;
      selector = '.results';
    }

    const results = document.querySelectorAll(selector);

    if(results && results.length){
      results.forEach((element) => element.parentNode && element.parentNode.removeChild(element));
    }

    if(typeof(fn) === 'function'){
      fn();
    }

    return this;
  }
});

export default Eleven;
