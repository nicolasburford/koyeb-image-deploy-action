const core = require('@actions/core');
const github = require('@actions/github');
const http = require('./common/http');

const main = () => {
  const serviceId = core.getInput('service-id');
  const dockerImageUrl = core.getInput('docker-image');
  const koyebToken = core.getInput('koyeb-token');

  let service = await http.request({
    host: 'app.koyeb.com',
    port: 443,
    method: 'GET',
    path: `/v1/services/${serviceId}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${koyebToken}`,
    }
  }).then(res=>res.service)

  let deployment = await http.request({
    host: 'app.koyeb.com',
    port: 443,
    method: 'GET',
    path: `/v1/deployments/${service.latest_deployment_id}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${koyebToken}`,
    }
  }).then(res=> res.deployment)

  let body = {
    "definition": {
      "name": deployment.definition.name,
      "docker": deployment.definition.docker,
      "regions": deployment.definition.regions,
      "ports": deployment.definition.ports,
      "instance_types": deployment.definition.instance_types,
      "scalings": deployment.definition.scalings,
      "env": deployment.definition.env
    }
  }

  body.definition.docker.image=dockerImageUrl

  body.definition.env.forEach((item,i)=>{
    if (item.key=='COMMIT_HASH') {
      body.definition.env[i].value=github.context.sha
    }
  })

  await http.request({
    host: 'app.koyeb.com',
    port: 443,
    method: 'PATCH',
    path: `/v1/services/${serviceId}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${koyebToken}`,
    }
  }, body).then(res=>{
    console.log(res);
  })
 
}

main().catch(err=>{
  core.setFailed(err);
})
