/*global Backbone:true, $:true, _:true, App:true, async:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */
var ws;
var opened = false;
App.Views.Demo = Backbone.View.extend({
  els: [],
  views: [],
  poll: null,
  template: _.template('\
<div class="content">\
<h1>Demo</h1>\
<div class="temperature"><span class="temp-reading" id="F"></span>\
<span class="temp-reading" id="C"></span></div>\
<div class="LED"><button type="button" class="L" id="1"></button>\
<button type="button" class="L" id="2"></button></div>'),

  initialize: function(opts){
    _.bindAll(this, 'render', 'onClose');
    this.delegateEvents();

    this.device = opts.device;
    this.controller = opts.controller;

    this.listenTo(this.controller, 'change:view', this.render);
    this.render();
    // function to execute once the websocket has been closed
    var ip;
    var self = this;
    this.device.issueCommand({cmd: 'get', args:{args: 'network.ip'}}, function(err, res) {
      ip = res.response.replace('\r\n','');
      if(ws){
        ws.close();
        ws = undefined;
      }
      ws = new WebSocket('ws://10.10.10.1/stream');
      // function to execute when the socket has been opened successfully
      ws.onopen = function() {
        opened = true;
        console.log('WebSocket open to WiConnect device!');
      };
      ws.onclose = function() {
      // log a message to the console when the websocket is closed
        if(!opened){
          alert('Could not connect to WiConnect WebSocket, only one WebSocket may be open at a time.');
        }else{
          alert('WiConnect WebSocket was closed, please refresh the page to try again.');
        }
        console.log('WebSocket has been closed!');
      };

      // function to execute each time a message is received via the websocket
      ws.onmessage = function(event) {
      var reader;

      // log the message binary blob data to the console when we receive a websocket message
      if(event.data instanceof Blob) {
        reader = new FileReader();
        reader.onload = function() {
          self.parseWebSocket(reader.result);
          return console.log(reader.result);
        };
        return reader.readAsText(event.data);
      }
    };
    });
  },

  onClose: function(){
    this.stopListening();
  },
  events: {
      'click .L' : 'sendLed'
  },
sendMessage: function(msg) {
  if(opened && ws){
    console.log(msg);
    ws.send(msg+'\r');
  }else{
    alert("Could not send message: "+msg);
  }
},
sendLed: function(event){
  var $t = $(event.target);
  this.sendMessage("L:"+$t.attr('id'));
},
parseWebSocket: function(res){
  if(res.indexOf("Start...") === -1){
    var cmd = res.split(" ");
    var $button = $('button#'+cmd[0]+'.L');
    var state = 'on';
    var oldState = 'off';
  if(cmd[1].indexOf('ON') === -1){
    state = 'off';
    oldState = 'on';
  }
    $button.removeClass(oldState);
    $button.addClass(state);
  }
},
drawTemp: function(){
  var self = this;
  this.device.issueCommand({cmd: 'adc', args:{args: '20 therm_celsius_lut.csv'}}, function(err, res) {
    var celsTemp = res.response.replace('\r\n','');
    $('#F.temp-reading').empty();
    $('#C.temp-reading').empty();
    $('#C.temp-reading').append('Temperature: '+parseFloat(celsTemp).toFixed(2)+" \xB0C");
    $('#F.temp-reading').append('Temperature: '+(celsTemp * 9/5+32).toFixed(2)+" \xB0F");
    self.poll = setTimeout(function(){self.drawTemp();self.pollNRF();}, 500 );
  });
},pollNRF: function() {
  var self = this;
  //self.sendMessage("B:1,2");
},
  render: function(){
    var self = this;
    clearTimeout(self.poll);
    if(this.controller.get('view') !== 'demo'){
      $(this.el).removeClass('active');
      return;
    }
    this.$el.html(this.template()).addClass('active');
    self.drawTemp();
  }
});
