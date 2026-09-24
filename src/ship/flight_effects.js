function updateFlightFx(dt = 0.016) {
  updateWarpStream(dt);
  const canvas = $('flightFx');
  if (!canvas) return;
  if (canvas.width !== innerWidth || canvas.height !== innerHeight) {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Smooth natural lens flare when facing sun
  drawLensFlare(ctx, canvas, dt);

  if (heat > .03) {
    const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * .18, canvas.width / 2, canvas.height / 2, canvas.width * .65);
    grad.addColorStop(0, 'rgba(255,130,50,0)');
    grad.addColorStop(1, `rgba(255,96,40,${Math.min(.65, heat * .65)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

