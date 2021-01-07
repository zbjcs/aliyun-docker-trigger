#!/usr/bin/expect
set timeout 20
set password "bajie###2020"
spawn /usr/bin/sudo docker login --username=青岛八戒共享 registry.cn-beijing.aliyuncs.com
expect "Password: "
send "$password\n"
expect "Login Succeeded"
interact
