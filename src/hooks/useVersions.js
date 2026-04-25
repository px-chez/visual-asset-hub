import { useStorage } from './useStorage';

export const useVersions = () => {
  const { getFileVersions } = useStorage();

  const fetchVersions = async (projectId, fileName, page = 1, limit = 10) => {
    return await getFileVersions(projectId, fileName, page, limit);
  };

  return { fetchVersions };
};