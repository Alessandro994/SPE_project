# SPE final project
The repository for the final project of the SPE course.

# Setup

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



# Start simulation

To start a simulation, open three different shells.

Start NGINX with the following command:
```
nginx -c nginx.conf -p "$PWD"
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


