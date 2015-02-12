class Transit
  attr_accessor :directions

  def initialize(transit)
    @directions = parse(transit['directions'])
  end

  private
    def parse(directions)
      dir_array = []
      directions.each do |route|
        dir_array << {
          duration: (route['end_time'] - route['start_time']) / 60,
          walk_time: route['walk_time'] / 60,
          transit_time: route['transit_time'] / 60,
          wait_time: route['wait_time'] / 60,
          walk_distance: route['walk_distance'],
          xfers: route['xfers'],
          fare: route['fare']
        }
      end
      dir_array
    end
end
