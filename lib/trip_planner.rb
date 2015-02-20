require './lib/car'
require './lib/walk'
require './lib/transit'

class TripPlanner
	attr_accessor :routes, :car, :walk, :transit

	def initialize(origin, destination)
		@routes = HTTParty.get("http://localhost:3000/?origin=#{to_query(origin)}&destination=#{to_query(destination)}")

		@car = @routes['car']
		@walk = @routes['walk']
		@transit = @routes['transit']
	end

	def to_query(str)
		str.gsub(' ', '+') + '+seattle'
	end
end
