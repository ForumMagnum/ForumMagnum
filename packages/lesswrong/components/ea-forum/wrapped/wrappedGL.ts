/**
 * So, here’s the delightful mess we’re dealing with:
 *
 * We have videos that use the BT.709 color profile, but browsers are expecting
 * sRGB. This causes the background colors to look completely wrong when rendered.
 *
 * I tried the noble path of gamma correction, but that looked crumby for reasons
 * that I don't have time to investigate. Instead, we can just hack it by changing
 * the brightness. Unfortunately the `filter: brightness()` CSS property is off
 * limits because we need to be able to take a screenshot with `html2canvas` which
 * doesn't support `filter`.
 *
 * The only way around this (as far as I can tell) is to take the nuclear option
 * and render the video with WebGL where we can use a custom fragment shader that
 * will be preserved by html2canvas as long as we initialize the WebGL context with
 * `preserveDrawingBuffer: true`.
*/

const vertexSrc = `
  attribute vec2 a_position;
  varying vec2 v_texcoord;
  void main() {
    v_texcoord = vec2((a_position.x + 1.0) * 0.5, (1.0 - a_position.y) * 0.5);
    gl_Position = vec4(a_position, 0, 1);
  }
`;

const fragmentSrc = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform float u_brightness;
  varying vec2 v_texcoord;
  void main() {
    vec4 color = texture2D(u_texture, v_texcoord);
    color.rgb *= u_brightness;
    gl_FragColor = color;
  }
`;

const compileShader = (gl: WebGL2RenderingContext, src: string, type: number) => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Failed to create shader");
  }
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
};

const createProgram = (gl: WebGL2RenderingContext) => {
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Failed to create program");
  }
  gl.attachShader(program, compileShader(gl, vertexSrc, gl.VERTEX_SHADER));
  gl.attachShader(program, compileShader(gl, fragmentSrc, gl.FRAGMENT_SHADER));
  gl.linkProgram(program);
  gl.useProgram(program);
  return program;
}

const createGeometry = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const points = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
  const positionLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
  return positionBuffer;
}

const createTexture = (gl: WebGL2RenderingContext) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

export const createWrappedVideoCanvas = (
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  brightness: number,
) => {
  const gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true});
  if (!gl) {
    throw new Error("Can't get WebGL context for canvas");
  }
  const program = createProgram(gl);
  createGeometry(gl, program);
  const texture = createTexture(gl);
  const brightnessLoc = gl.getUniformLocation(program, "u_brightness");
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  return () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(brightnessLoc, brightness);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
}
