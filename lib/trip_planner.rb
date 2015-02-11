require 'httparty'
require './lib/car.rb'

class TripPlanner
	attr_accessor :routes, :car, :walk, :transit

	def initialize
		puts 'is too initialized'
	end

	# def initialize(origin, destination)
	# 	@routes = HTTParty.get("http://localhost:3000/?origin=#{to_query(origin)}&destination=#{to_query(destination)}")
	# 	@car = Car.new(@routes['car'])
	# 	@walk = @routes['walk']
	# 	@transit = @routes['transit']
	# end

private
		def to_query(str)
			str.gsub(' ', '+') + '+seattle'
		end
end
