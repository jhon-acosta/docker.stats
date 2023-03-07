## Docker Stats

Permite tener los datos segundo/segundo de las estadísticas de la memoria, cpu, etc de cada contenedor.


#### Pasos para levantar el stack
```sh
> docker build -t docker-stats .
> docker stack deploy -c ./docker.stats.api.yml docker_stats

```
