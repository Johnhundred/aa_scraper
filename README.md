# Argentarchives.org Scraper

#### Prerequisites & Dependencies

* Docker
* Docker-compose
* Node (& NPM)
* Linux system (Hasn't been tested on anything else)
* CRON or similar scheduler
* Browser-based dynamic scraper

Currently, this scraper functions based on a modification of my own ajax_scraper project, which means it requires a running scraper on localhost port 46464, which accepts a query variable by the name of url.

## Operation

#### Development

Development operation is identical to production, except for the display of fairly-spammy debug messages and general timing information of calls. Development also employs Nodemon for rapid prototyping. To test out the scraper, run the following commands after ensuring that the scraper mentioned above is available:

```
docker-compose up -d
npm run dev
npm run dev:stragglers
```

#### Production

Production is similar to development, except that debug messages are suppressed, and it uses the standard node runtime environment. Running the production version takes the following commands:

```
docker-compose up -d
npm run scrape
npm run scrape:stragglers
```

##### CRON Jobs

The scraper has been set to run with the following CRON jobs. The pacing is deliberate, so as to not disrupt operation of the site being scraped. Therefore, if the scraper is tested, allow it to run for at the very least 6-7 hours for a beginning representation of what data it gathers. The longer, the better. Replace anything below in square brackets with your own paths/values.

```
@reboot sleep 60 && /usr/local/bin/docker-compose -f [PATH_TO_DYNAMIC_SCRAPER_DOCKER_COMPOSE_FILE] up -d
@reboot sleep 60 && /usr/local/bin/docker-compose -f [PATH_TO_THIS_SCRAPER'S_DOCKER_COMPOSE_FILE] up -d
@reboot sleep 120 && cd [PATH_TO_THIS_SCRAPER'S_DIRECTORY] && npm run scrape
@reboot sleep 240 && cd [PATH_TO_THIS_SCRAPER'S_DIRECTORY] && npm run scrape:stragglers
1 */3 * * * cd [PATH_TO_THIS_SCRAPER'S_DIRECTORY] && npm run scrape
3 */2 * * * cd [PATH_TO_THIS_SCRAPER'S_DIRECTORY] && npm run scrape:stragglers
```

## Visualization

No external visualization has as of yet been built for this project. Neo4j's dashboard (standard location: http://localhost:7474/browser/ ) has been sufficient so far.
