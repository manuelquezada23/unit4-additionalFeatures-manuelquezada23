import { ILink, isSameLink, makeILink } from "../../../../types";
import { BackendLinkGateway } from "../../../../links";

import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("Unit Test: getLinksByAnchorId", () => {
  let uri: string;
  let mongoClient: MongoClient;
  let backendLinkGateway: BackendLinkGateway;
  let mongoMemoryServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoMemoryServer = await MongoMemoryServer.create();
    uri = mongoMemoryServer.getUri();
    mongoClient = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    backendLinkGateway = new BackendLinkGateway(mongoClient);
    mongoClient.connect();
  });

  beforeEach(async () => {
    const response = await backendLinkGateway.deleteAll();
    expect(response.success).toBeTruthy();
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoMemoryServer.stop();
  });

  test("gets links when given valid anchorId", async () => {
    const validLink1: ILink = makeILink(
      "link1",
      "anchor1",
      "anchor2",
      "node1",
      "node2"
    );
    const createResponse1 = await backendLinkGateway.createLink(validLink1);
    expect(createResponse1.success).toBeTruthy();
    const validLink2: ILink = makeILink(
      "link2",
      "anchor2",
      "anchor1",
      "node1",
      "node2"
    );
    const createResponse2 = await backendLinkGateway.createLink(validLink2);
    expect(createResponse2.success).toBeTruthy();
    const validLink3: ILink = makeILink(
      "link3",
      "anchor3",
      "anchor2",
      "node1",
      "node2"
    );
    const createResponse3 = await backendLinkGateway.createLink(validLink3);
    expect(createResponse3.success).toBeTruthy();
    const validLink4: ILink = makeILink(
      "link4",
      "anchor3",
      "anchor1",
      "node1",
      "node2"
    );
    const createResponse4 = await backendLinkGateway.createLink(validLink4);
    expect(createResponse4.success).toBeTruthy();
    const getLinkByAnchorIdResp = await backendLinkGateway.getLinksByAnchorId(
      "anchor2"
    );
    expect(getLinkByAnchorIdResp.success).toBeTruthy();
    expect(getLinkByAnchorIdResp.payload.length).toBe(3);
    const link1 = getLinkByAnchorIdResp.payload.find(
      (link: { linkId: string }) => link.linkId === "link1"
    );
    expect(isSameLink(link1, validLink1)).toBeTruthy();
    const link2 = getLinkByAnchorIdResp.payload.find(
      (link: { linkId: string }) => link.linkId === "link2"
    );
    expect(isSameLink(link2, validLink2)).toBeTruthy();
    const link3 = getLinkByAnchorIdResp.payload.find(
      (link: { linkId: string }) => link.linkId === "link3"
    );
    expect(isSameLink(link3, validLink3)).toBeTruthy();
  });

  test("success with empty payload array when given invalid anchorId", async () => {
    const validLink: ILink = makeILink(
      "link1",
      "anchor1",
      "anchor2",
      "node1",
      "node2"
    );
    const createResponse = await backendLinkGateway.createLink(validLink);
    expect(createResponse.success).toBeTruthy();
    const getLinkByIdResp = await backendLinkGateway.getLinksByAnchorId(
      "anchor3"
    );
    expect(getLinkByIdResp.success).toBeTruthy();
    expect(getLinkByIdResp.payload.length).toBe(0);
  });
});
