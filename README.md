# SPE final project
The repository for the final project of the SPE course.

# Setup

## Conda
Install the conda environment

```bash
conda env --file environment.yml
```

## Nginx ([wiki](https://www.nginx.com/resources/wiki/start/))

1. Run the following command to apppend the appropriate stanza to `/etc/apt/sources.list`, replacing `$release` with your Linux release (ex. `bionic`).
```bash
    echo "deb https://nginx.org/packages/ubuntu/ $release nginx" | sudo tee /etc/apt/sources.list.d/nginx.list
```
2. Run the following commands in a shell:
```
    sudo apt-get update
    sudo apt-get install nginx
```
For any problem refer to [https://www.nginx.com/resources/wiki/start/topics/tutorials/install/](link)

3. You may want to disable auto-start of NGINX at startup of computer:
```bash
sudo systemctl disable nginx
```

## K6 ([doc](https://k6.io/docs/))

The fastest way is to download the binary file from GitHub at the following [link](https://github.com/loadimpact/k6/releases). Install the binary in your PATH to run k6 from any location. This can be, for example, `/usr/local/bin`.


## Node

Install an updated version of NodeJS using `nvm`
```bash
nvm install --lts=Erbium
```

# Start simulation

To start a simulation, open three different shells.

Start NGINX with the following command:
```
nginx -c nginx/nginx.conf -p "$PWD"
```

Let Docker do the magic with:
```
docker-compose up
```

Launch the load test with `k6`:
```
k6 run script.js --out influxdb --duration 20s
```

# Server configuration

Servers are implemented with Node Express and TypeScript.
The first time you have to run `npm install` to install the project dependencies.

If you edit the `server.ts` file, then run `npm run tsc` to compile it. The result will be located in the `build` folder.

## Environment variables
* `PORT`*: the port the requests are sent to
* `SERVER_ID`*: the server identifier
* `SEED`: a value that can be provided to produce consistent results. If not defined, the pseudorandom number generator uses the current date under-the-hood.
* `MIN_RESPONSE_TIME`: the time after which the server responds to a request.
* `EXP_RESPONSE_TIME`: If defined, the server draws a random values from an exponential distribution.
* `LAMBDA`: the lambda parameter of the exponential distribution. Default = 1.

Variables with * are automatically provided by the Bash script that boostrap the servers.

## Start simulation
To start a simulation run, run the following command.
The environment variables need to be declared inline before the script.

```bash
MIN_RESPONSE_TIME=100 NUM_SERVERS=1 npm run simulation

NGINX_SERVER_PARAM=max_conns=5 LOAD_BALANCING=least_conn NUM_SERVERS=2 MIN_RESPONSE_TIME=100 EXP_RESPONSE_TIME=true K6_ITERATIONS=10000 K6_VUS=20 LAMBDA=0.01 SEED=10 K6_RPS=100 npm run simulation
```


## Cleanup DB
Clear all series in influxdb
```bash
docker-compose exec influxdb influx -database k6 -execute 'DROP SERIES FROM /.*/'
```