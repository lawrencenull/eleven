Eleven.ready(function(){

  document.getElementById('toggleCommands').addEventListener('click', function(){
    var element = document.getElementById('supported');

    if(element.classList.contains('show')){
      this.textContent = 'Show Commands';
      element.classList.remove('show');
    }else{
      this.textContent = 'Hide Commands';
      element.classList.add('show');
    }
  });

  if(Eleven){
    var sessionId = Eleven.uuid();
    // init
    Eleven('#eleven', {
      debug: true,
      onStop: function(){
        document.body.style.border = 0;
        document.body.style.boxShadow = 'none';
      },
      onCommand: function(params, speech, command){
        Eleven.ajax({
          url: 'https://api.api.ai/api/query?v=20150910&lang=en',
          data: {
            sessionId: sessionId,
            query: speech,
            access_token: 'a0a87a32cec4454aa6bbd3909ecbca14'
          },
          headers: {
            Authorization: 'Bearer 7e11b6f7694f4444b0df75b77cc0a457'
          },
          dataType: 'json',
          success: (response) => {
            var news = this.getPlugin('news'),
                weather = this.getPlugin('weather'),
                yelp = this.getPlugin('yelp');

            if(response.status.code > 199 && response.status.code < 400){
              var result = response.result,
                  output = result.fulfillment.speech;

              if(result.action === 'weather' || result.action === 'forecast'){

                var parameters = result.parameters,
                    city = parameters.address.city;

                weather.forecast(city);
              }

              if(result.action === 'weather.temperature'){
                var parameters = result.parameters,
                    city = parameters.address.city;

                weather.temperature(city);
              }

              if(result.action === 'food.search'){
                var parameters = result.parameters;

                yelp.search({
                  term: parameters.food,
                  location: parameters['geo-city']
                }, output);
              }

              if(result.action === 'news.search'){
                var parameters = result.parameters;
                news.headlines();
              }

              if(output){
                Eleven.speak(output);
              }
            }
          }
        });
      }
    });

     var fn = function(params, phrase, command, plugin){
       console.log(params, phrase, command, plugin);
     }

    // instance will always be returned after init
    Eleven()
      .plugin('news', {
        commands: {
          'hello :name': fn,
          'hey (there)': fn,
          'hi': fn,
          'hello': function(a, b){
            document.body.style.border='10px solid pink';
          },
          'news now': function(a, b, c){
            document.body.style.boxShadow ='inset 0 0 0 10px yellow';
            console.log('MUFFFFIIINNNN!!!!!!!!!', a, b, c);
          }
        }
      })
      .plugin('weather')
      .plugin('webSearch')
      .plugin('yelp', {
        params: {
          consumerSecret: 'WoFonmd-gRsQ0LX1KX_7AMs8mgA',
          tokenSecret: 'qsrlMjQGoucx9D8OM0B0XCL2VJA',
          oauth_consumer_key: 'lqhazuTbcv2eTGCpamZedA',
          oauth_token: 'VBlTansWmoTVcmX87GpUlhHNht5i4dpt'
        }
      })
      .addCommands({
        'hello :name': function(){
          console.log('asdoksaodk');
        }
      });


    Eleven().parser(['hi']);

    setTimeout(function(){
      Eleven().parser(['hello kieran']);
    }, 2000);
    //
    setTimeout(function(){
      Eleven().parser(['stop'])
    }, 10000);


    setTimeout(function(){
      Eleven().parser(['hello Kieran'])
    }, 11000);
    //
    // setTimeout(function(){
    //   Eleven().removeCommands(['hello :name', 'stop']);
    //   console.log(Eleven());
    // }, 2000);

  }
});
