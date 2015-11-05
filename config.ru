require 'sinatra'

get "/" do
  "A site.  Definitely."
end

run Sinatra::Application