## Docker Stats

Permite tener los datos segundo/segundo de las estadísticas de la memoria, cpu, etc de cada contenedor.

#### Pasos para levantar el stack (DESARROLLO)

```sh
> DEBUG=api:* npm run dev
# La ejecucuón debe ser en la raįz de proyecto para escribir el archivo `stats.txt`
> docker stats --format 'table {{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}|' > ./src/static/stats.txt

```

#### Pasos para levantar el stack (PRODUCCIÓN)

```sh
> docker build -t docker-stats .
> docker stack deploy -c ./docker.stats.api.yml docker_stats

```
