npm i #at root 
cd .\agent\ npm i
cd .\orchestrator\ npm i


docker-compose down

docker-compose up -d

# Run individual tests
node fis.js memory 3      # Memory stress
node fis.js network 5 200 # Network latency  
node fis.js dbio 3        # DB I/O stress
node fis.js killapp       # Process kill
node fis.js pauseapp 3    # Container pause