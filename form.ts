"use strict";

import { APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { Octokit } from "@octokit/rest";
import {
  generateNotaJson,
  generatePath,
  NotaFuvest,
  notaFuvestValidate as notaFuvestValidate,
} from "core/entity/NotaFuvest";
import { v4 as uuidv4 } from "uuid";

const secret = process.env["SECRET"] ?? 4;
const githubToken = process.env["GITHUB_TOKEN"];

export const handler = async (
  event: APIGatewayEvent
  // context: Context
): Promise<APIGatewayProxyResult> => {
  let nota: NotaFuvest;
  try {
    nota = parseNota(event);
  } catch (error) {
    return {
      statusCode: 400,
      body: error.message,
    };
  }

  let filepath = generatePath(nota) + "/" + uuidv4() + "/data.json";
  let filecontent = generateNotaJson(nota);

  let uploadedFile;
  try {
    uploadedFile = await uploadFile(filepath, filecontent);
  } catch (error) {
    return {
      statusCode: 500,
      body: error.message,
    };
  }

  return {
    statusCode: 200,
    body: uploadedFile,
  };
};

function parseNota(event: APIGatewayEvent): NotaFuvest {
  let nota = JSON.parse(event.body ?? "{}") as NotaFuvest;

  let erro = notaFuvestValidate(nota);

  if (erro) {
    throw new Error(erro);
  }

  return nota;
}

async function uploadFile(filepath: string, content: string) {
  const owner = "ManualDoVestibulando";
  const repo = "data";
  const branchName = `raw`;

  const octokit = new Octokit({
    auth: githubToken,
  });

  const createOrUpdateFileResponse = await octokit.repos.createOrUpdateFileContents(
    {
      owner,
      repo,
      path: filepath,
      branch: `refs/heads/${branchName}`,
      message: `Create  ${filepath}`,
      content: Buffer.from(content).toString("base64"),
    }
  );
  return createOrUpdateFileResponse.data.content.html_url; // atualmente tá quebrado
}
