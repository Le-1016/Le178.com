using LibPQ
using Tables

connection = LibPQ.Connection(ENV["DATABASE_URL"])
result = execute(connection, "SELECT message FROM experiments ORDER BY id LIMIT 1")
message = first(Tables.rowtable(result)).message
close(connection)

println("Julia connected to PostgreSQL: $message")
