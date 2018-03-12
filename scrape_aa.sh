#! /bin/bash

cd ~/docker_work/overskrift/scraper/ && docker-compose up -d
sleep 10s
cd ~/personal-projects/aa_scraper/project/ && docker-compose up -d
sleep 10s
cd ~/personal-projects/aa_scraper/project/ && npm run scrape

@reboot sleep 60 && /usr/local/bin/docker-compose -f ~/docker_work/overskrift/scraper/docker-compose.yml up -d
@reboot sleep 60 && /usr/local/bin/docker-compose -f ~/personal-projects/aa_scraper/project/docker-compose.yml up -d
* */3 * * * 
