(function($) {
	
/*
TODO:
- better way to select/multiselect a model in a collection
  https://github.com/derickbailey/backbone.picky
  https://github.com/hashchange/backbone.select
*/

var Seat = Backbone.Model.extend({
	
});

var SeatCollection = Backbone.Collection.extend({
	model: Seat,
	selected: null
});

var SeatMap = Backbone.View.extend({
	events: {
		'click .desk': 'onClick'
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
		this.listenTo(this.seats, 'hilite', this.hiliteSeats);
	},
	
	hiliteSeats: function(ids) {
		var seats = this.seats;
		var $el = this.$el;
		
		if (ids && ids.length) {
			_.each(ids, function(id) {
				var $seat = $el.find('#'+id);
				$seat[0].classList.add('hilite');
			});
		}
		else {
			this.seats.each(function(seat) {
				var $seat = $el.find('#'+seat.id);
				$seat[0].classList.remove('hilite');
			});
		}
	},
	
	onClick: function(e) {
		var id = e.target.id;
		this.seats.selected = id;
		this.seats.trigger('selected', id);
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
	}
});

var SeatDashboard = Backbone.View.extend({
	events: {
		'mouseenter .seat-legend.available': 'hiliteAvailableSeats',
		'mouseenter .seat-legend.occupied': 'hiliteOccupiedSeats',
		'mouseleave .seat-legend': 'hiliteNone'
	},
	
	initialize: function(options) {
		this.seats = options.seats;
		
		this.listenTo(this.seats, 'change', this.render);
		
		this.render();
	},
	
	hiliteAvailableSeats: function() {
		this.hiliteSeatsWhere({status: 'available'});
	},
	
	hiliteOccupiedSeats: function() {
		this.hiliteSeatsWhere({status: 'occupied'});
	},
	
	hiliteSeatsWhere: function(attrs) {
		var seats = this.seats.where(attrs);
		var ids = _.pluck(seats, 'id');
		this.seats.trigger('hilite', ids);
	},
	
	hiliteNone: function() {
		this.seats.trigger('hilite', []);
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

var SeatDetails = Backbone.View.extend({
	events: {
		'click .seat-reserve': 'reserve'
	},
	
	initialize: function(options) {
		this.seats = options.seats;
		
		this.listenTo(this.seats, 'selected', this.render);
		
		this.render(this.seats.selected);
	},
	
	render: function(id) {
		var seat = this.seats.get(id);
		if (!seat) {
			return;
		}
		
		var template = _.template($('#seat-details-template').html());
		var html = template({
			id: id,
			cost: seat.get('cost'),
			status: seat.get('status')
		});
		this.$el.html(html);
		return this;
	},
	
	reserve: function() {
		var id = this.seats.selected;
		var seat = this.seats.get(id);
		if (!seat) {
			return;
		}
		seat.set('status', 'occupied');
		
		// re-render this view
		this.render(id);
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
			}),
			
			seatdetails: new SeatDetails({
				el: this.$('#seat-details')[0],
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