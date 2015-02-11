require './lib/trip_planner'

class Car < TripPlanner
  attr_accessor :address, :itinerary

  def initialize(car)
    TripPlanner.new
  #   @address = address_str(car['address'])
  #   @itinerary = car['itinerary']
  end

  private
    def address_str(address)
      street = /^(.*),/.match(address)[1]
      split = street.index /(\s|\d)*$/
      street[split+1..-1] + ' ' + street[0...split]
    end
end
