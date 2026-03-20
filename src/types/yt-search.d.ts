declare module "yt-search" {
  interface VideoResult {
    videoId: string;
    url: string;
    title: string;
    description: string;
    duration: { seconds: number; timestamp: string };
    views: number;
    thumbnail: string;
    ago: string;
    author: { name: string; url: string };
  }

  interface SearchResult {
    videos: VideoResult[];
  }

  function yts(query: string): Promise<SearchResult>;
  export = yts;
}
