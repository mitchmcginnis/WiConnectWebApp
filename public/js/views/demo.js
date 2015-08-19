/*global Backbone:true, $:true, _:true, App:true, async:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */


App.Views.Demo = Backbone.View.extend({
  poll: null,
  template: _.template('\
<div class="content">\
<h1>Demo</h1>\
<div class="text">This exciting demo is almost available.</div>\
<div class="temperature">Temperature: <span class="temp-reading"></span></div>'),

  initialize: function(opts){
    _.bindAll(this, 'render', 'onClose');
    this.delegateEvents();

    this.device = opts.device;
    this.controller = opts.controller;

    this.listenTo(this.controller, 'change:view', this.render);
    this.render();
  },

  onClose: function(){
    this.stopListening();
  },

  events: {
    'click .cone': 'onCone',
    'click .base': 'onBase'
  },

  onBase: function(){

  },

  onCone: function(){

  },

  convertCtoF: function(cTemp){
    return cTemp * 9/5+32;
  },

drawTemp: function(){
  var self = this;
  self.device.issueCommand({cmd: 'adc', args:{args: '7 thermistor.csv'}}, function(err, res) {
    var celsTemp = res.response.replace('\r\n','');
    $('.temp-reading').empty();
    $('.temp-reading').append(celsTemp.toPrecision(4)+" C "+self.convertCtoF(celsTemp).toPrecision(4)+" F");
  });
  self.poll = setTimeout(this.drawTemp, 1000);
},
  render: function(){
    var self = this;

    if(this.controller.get('view') !== 'demo'){
      $(this.el).removeClass('active');
      return;
    }
    this.$el.html(this.template()).addClass('active');
    self.device.issueCommand({cmd: 'adc', args:{args: '7 thermistor.csv'}}, function(err, res) {
      var celsTemp = res.response.replace('\r\n','');
      $('.temp-reading').empty();
      $('.temp-reading').append(parseFloat(celsTemp).toFixed(2)+" 	\xB0C "+self.convertCtoF(celsTemp).toFixed(2)+" 	\xB0F");
    });
    self.poll = setTimeout(this.render, 100);
  }
});
