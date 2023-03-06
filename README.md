### Docker Stats

- Para escribir los stats de docker en un archivo ejecutar el siguiente comando:

```sh
docker stats --format "table {{.Container}} - {{.Name}} - {{.CPUPerc}} - {{.MemUsage}} - {{.MemPerc}} - {{.NetIO}} - {{.BlockIO}}"
```
