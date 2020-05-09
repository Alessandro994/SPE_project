# SPE_project
The repository for the final project of the SPE course.

## Setup

### Nginx

1. Append the appropriate stanza to `/etc/apt/sources.list`.
```bash
    deb https://nginx.org/packages/ubuntu/ $release nginx
```
2. Run the following commands in a shell:
```
    sudo apt-get update
    sudo apt-get install nginx
```
For any problem refer to [https://www.nginx.com/resources/wiki/start/topics/tutorials/install/](link)

For Ubuntu Bionic
```bash
echo "deb https://nginx.org/packages/ubuntu/ bionic nginx" | sudo tee /etc/apt/sources.list.d/nginx.list
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ABF5BD827BD9BF62

sudo apt update
sudo apt install nginx
```

If you want to disable auto-start of Nginx at startup of computer:
```bash
sudo systemctl disable nginx
```

nginx -c nginx.conf -p "$PWD"