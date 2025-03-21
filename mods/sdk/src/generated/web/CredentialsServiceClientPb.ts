/**
 * @fileoverview gRPC-Web generated client stub for fonoster.credentials.v1beta2
 * @enhanceable
 * @public
 */

// Code generated by protoc-gen-grpc-web. DO NOT EDIT.
// versions:
// 	protoc-gen-grpc-web v1.5.0
// 	protoc              v5.29.3
// source: credentials.proto


/* eslint-disable */
// @ts-nocheck


import * as grpcWeb from 'grpc-web';

import * as credentials_pb from './credentials_pb'; // proto import: "credentials.proto"


export class CredentialsServiceClient {
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string; };
  options_: null | { [index: string]: any; };

  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'text';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname.replace(/\/+$/, '');
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodDescriptorCreateCredentials = new grpcWeb.MethodDescriptor(
    '/fonoster.credentials.v1beta2.CredentialsService/CreateCredentials',
    grpcWeb.MethodType.UNARY,
    credentials_pb.CreateCredentialsRequest,
    credentials_pb.CreateCredentialsResponse,
    (request: credentials_pb.CreateCredentialsRequest) => {
      return request.serializeBinary();
    },
    credentials_pb.CreateCredentialsResponse.deserializeBinary
  );

  createCredentials(
    request: credentials_pb.CreateCredentialsRequest,
    metadata?: grpcWeb.Metadata | null): Promise<credentials_pb.CreateCredentialsResponse>;

  createCredentials(
    request: credentials_pb.CreateCredentialsRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: credentials_pb.CreateCredentialsResponse) => void): grpcWeb.ClientReadableStream<credentials_pb.CreateCredentialsResponse>;

  createCredentials(
    request: credentials_pb.CreateCredentialsRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: credentials_pb.CreateCredentialsResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/fonoster.credentials.v1beta2.CredentialsService/CreateCredentials',
        request,
        metadata || {},
        this.methodDescriptorCreateCredentials,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/fonoster.credentials.v1beta2.CredentialsService/CreateCredentials',
    request,
    metadata || {},
    this.methodDescriptorCreateCredentials);
  }

  methodDescriptorUpdateCredentials = new grpcWeb.MethodDescriptor(
    '/fonoster.credentials.v1beta2.CredentialsService/UpdateCredentials',
    grpcWeb.MethodType.UNARY,
    credentials_pb.UpdateCredentialsRequest,
    credentials_pb.UpdateCredentialsResponse,
    (request: credentials_pb.UpdateCredentialsRequest) => {
      return request.serializeBinary();
    },
    credentials_pb.UpdateCredentialsResponse.deserializeBinary
  );

  updateCredentials(
    request: credentials_pb.UpdateCredentialsRequest,
    metadata?: grpcWeb.Metadata | null): Promise<credentials_pb.UpdateCredentialsResponse>;

  updateCredentials(
    request: credentials_pb.UpdateCredentialsRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: credentials_pb.UpdateCredentialsResponse) => void): grpcWeb.ClientReadableStream<credentials_pb.UpdateCredentialsResponse>;

  updateCredentials(
    request: credentials_pb.UpdateCredentialsRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: credentials_pb.UpdateCredentialsResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/fonoster.credentials.v1beta2.CredentialsService/UpdateCredentials',
        request,
        metadata || {},
        this.methodDescriptorUpdateCredentials,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/fonoster.credentials.v1beta2.CredentialsService/UpdateCredentials',
    request,
    metadata || {},
    this.methodDescriptorUpdateCredentials);
  }

  methodDescriptorGetCredentials = new grpcWeb.MethodDescriptor(
    '/fonoster.credentials.v1beta2.CredentialsService/GetCredentials',
    grpcWeb.MethodType.UNARY,
    credentials_pb.GetCredentialsRequest,
    credentials_pb.Credentials,
    (request: credentials_pb.GetCredentialsRequest) => {
      return request.serializeBinary();
    },
    credentials_pb.Credentials.deserializeBinary
  );

  getCredentials(
    request: credentials_pb.GetCredentialsRequest,
    metadata?: grpcWeb.Metadata | null): Promise<credentials_pb.Credentials>;

  getCredentials(
    request: credentials_pb.GetCredentialsRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: credentials_pb.Credentials) => void): grpcWeb.ClientReadableStream<credentials_pb.Credentials>;

  getCredentials(
    request: credentials_pb.GetCredentialsRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: credentials_pb.Credentials) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/fonoster.credentials.v1beta2.CredentialsService/GetCredentials',
        request,
        metadata || {},
        this.methodDescriptorGetCredentials,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/fonoster.credentials.v1beta2.CredentialsService/GetCredentials',
    request,
    metadata || {},
    this.methodDescriptorGetCredentials);
  }

  methodDescriptorDeleteCredentials = new grpcWeb.MethodDescriptor(
    '/fonoster.credentials.v1beta2.CredentialsService/DeleteCredentials',
    grpcWeb.MethodType.UNARY,
    credentials_pb.DeleteCredentialsRequest,
    credentials_pb.DeleteCredentialsResponse,
    (request: credentials_pb.DeleteCredentialsRequest) => {
      return request.serializeBinary();
    },
    credentials_pb.DeleteCredentialsResponse.deserializeBinary
  );

  deleteCredentials(
    request: credentials_pb.DeleteCredentialsRequest,
    metadata?: grpcWeb.Metadata | null): Promise<credentials_pb.DeleteCredentialsResponse>;

  deleteCredentials(
    request: credentials_pb.DeleteCredentialsRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: credentials_pb.DeleteCredentialsResponse) => void): grpcWeb.ClientReadableStream<credentials_pb.DeleteCredentialsResponse>;

  deleteCredentials(
    request: credentials_pb.DeleteCredentialsRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: credentials_pb.DeleteCredentialsResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/fonoster.credentials.v1beta2.CredentialsService/DeleteCredentials',
        request,
        metadata || {},
        this.methodDescriptorDeleteCredentials,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/fonoster.credentials.v1beta2.CredentialsService/DeleteCredentials',
    request,
    metadata || {},
    this.methodDescriptorDeleteCredentials);
  }

  methodDescriptorListCredentials = new grpcWeb.MethodDescriptor(
    '/fonoster.credentials.v1beta2.CredentialsService/ListCredentials',
    grpcWeb.MethodType.UNARY,
    credentials_pb.ListCredentialsRequest,
    credentials_pb.ListCredentialsResponse,
    (request: credentials_pb.ListCredentialsRequest) => {
      return request.serializeBinary();
    },
    credentials_pb.ListCredentialsResponse.deserializeBinary
  );

  listCredentials(
    request: credentials_pb.ListCredentialsRequest,
    metadata?: grpcWeb.Metadata | null): Promise<credentials_pb.ListCredentialsResponse>;

  listCredentials(
    request: credentials_pb.ListCredentialsRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: credentials_pb.ListCredentialsResponse) => void): grpcWeb.ClientReadableStream<credentials_pb.ListCredentialsResponse>;

  listCredentials(
    request: credentials_pb.ListCredentialsRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: credentials_pb.ListCredentialsResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/fonoster.credentials.v1beta2.CredentialsService/ListCredentials',
        request,
        metadata || {},
        this.methodDescriptorListCredentials,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/fonoster.credentials.v1beta2.CredentialsService/ListCredentials',
    request,
    metadata || {},
    this.methodDescriptorListCredentials);
  }

}

