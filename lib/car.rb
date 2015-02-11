class Car
  attr_accessor :address, :itinerary, :walk_directions, :drive_directions, :walk_time, :drive_time

  def initialize(car)
    puts car
    @address = address_str(car['address'])
    @itinerary = car['itinerary']
    @walk_directions = @itinerary[0][0]
    @walk_time = @walk_directions['duration'] / 60
    @drive_directions = @itinerary[1][0]
    @drive_time = @drive_directions['duration'] / 60
  end

  private
    def address_str(address)
      street = /^(.*),/.match(address)[1]
      split = street.index /(\s|\d)*$/
      street[split+1..-1] + ' ' + street[0...split]
    end
end
