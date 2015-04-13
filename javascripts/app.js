(function($) {

var Seat = Backbone.Model.extend({
	
});

var SeatCollection = Backbone.Collection.extend({
	model: Seat
});

var SeatMap = Backbone.View.extend({
	events: {
		'click .desk': 'onClick',
		'dblclick .desk': 'onDoubleclick'
	},
	
	initialize: function(options) {
		this.seats = options.seats;
		
		// hack!! (so that we can apply CSS styles as normal)
		// get the raw SVG from the embedded image,
		// move it inline in the HTML document
		var doc = this.el.contentDocument;
		var $svg = $(doc).children('svg').eq(0);
		$svg.insertAfter(this.$el);
		
		// temporarily keep a reference to the current DOM element
		var $el = this.$el;
		
		// change this View to the new DOM element
		this.setElement($svg[0]);
		
		// remove the old DOM element
		$el.remove();
		
		// render
		this.render();
		
		this.listenTo(this.seats, 'change', this.render);
	},
	
	onClick: function(e) {
		var id = e.target.id;
		this.showInfo(id);
	},
	
	onDoubleclick: function(e) {
		var id = e.target.id;
		var seat = this.seats.get(id);
		seat.set('status', 'occupied');
	},
	
	render: function() {
		// TODO: find a more compatible way to addClass to svg
		// http://keith-wood.name/svg.html#dom
		// https://github.com/toddmotto/lunar
		
		var classNames = {
			"available": "available",
			"occupied": "occupied"
		};
		
		var $el = this.$el;
		
		this.seats.each(function(seat) {
			var $seat = $el.find('#'+seat.id);
			if (!$seat[0]) {
				// no DOM element
				return;
			}
			var status = seat.get('status');
			var className = classNames[status];
			if (className) {
				$seat[0].classList.add(className);
			}
		});
		
		return this;
	},
	
	showInfo: function(id) {
		var seat = this.seats.get(id);
		var status = seat.get('status');
		console.log(status);
	}
});

var SeatDashboard = Backbone.View.extend({
	initialize: function(options) {
		this.seats = options.seats;
		
		this.listenTo(this.seats, 'change', this.render);
		
		this.render();
	},
	
	render: function() {
		var available = this.seats.where({status: 'available'});
		var occupied = this.seats.where({status: 'occupied'});		
		
		var template = _.template($('#dashboard-template').html());
		var html = template({
			num_available: available.length,
			num_occupied: occupied.length
		});
		this.$el.html(html);
		return this;
	}
});

var SeatMapApp = Backbone.View.extend({
	initialize: function(options) {		
		// create collections
		this.collections = {
			seats: new SeatCollection(options.seats, {})
		};
		
		// initialize views
		this.views = {
			seatmap: new SeatMap({
				el: this.$('#office')[0],
				seats: this.collections.seats
			}),
			
			dashboard: new SeatDashboard({
				el: this.$('#dashboard')[0],
				seats: this.collections.seats
			})
		};

	}
});

$(window).on('load', function() {
	var app = new SeatMapApp({
		el: $('body')[0],
		seats: SEATS
	});
	window.app = app;
});

})(jQuery)