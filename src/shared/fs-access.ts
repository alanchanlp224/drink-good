/** File System Access API bits missing from default TypeScript DOM libs. */

export type FileSystemPermissionMode = "read" | "readwrite";

export interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemPermissionMode;
}

export interface WritableDirectoryHandle extends FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>;
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>;
}

/** Narrow a directory handle to the writable/permission methods we use. */
export function asWritableDirectory(
  handle: FileSystemDirectoryHandle,
): WritableDirectoryHandle {
  return handle as WritableDirectoryHandle;
}
