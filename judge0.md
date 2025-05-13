### To run judge0 in docker, run following code

    install wsl for windows

    open `cmd` prompt and type `wsl`

    cd judge0-v1.13.1
    docker-compose up -d db redis
    sleep 10s
    docker-compose up -d
    sleep 5s

## judge0 documenation link

https://github.com/judge0/judge0/blob/master/CHANGELOG.md