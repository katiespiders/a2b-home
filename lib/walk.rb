class Walk
  attr_accessor :walk_time, :distance, :directions

  def initialize(walk)
    @walk_time = walk['duration'] / 60
    @distance = walk['distance']
    @directions = walk['directions']
  end
end
