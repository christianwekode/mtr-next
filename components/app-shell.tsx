"use client";

import { ChatPane } from "@/components/chat-pane";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { TranscriptionPane } from "@/components/transcription-pane";
import { useWorkspace } from "@/hooks/use-workspace";

export function AppShell() {
  const {
    query,
    setQuery,
    folders,
    transcriptions,
    chats,
    selectedId,
    expandedFolderIds,
    bootError,
    showTranscriptionPane,
    paneDetail,
    detailLoading,
    selectedFolderName,
    currentChat,
    messages,
    status,
    fileInputRef,
    selectTranscription,
    handleMentionClick,
    toggleFolder,
    togglePane,
    handleNewChat,
    handleSelectChat,
    handleSend,
    handleAttachAudio,
    handleAudioChosen,
  } = useWorkspace();

  if (bootError) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white px-6 text-[13px] text-[#141414BD]">
        {bootError}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-white text-[13px] text-[#141414] antialiased">
      <Topbar query={query} onQueryChange={setQuery} />
      <div className="flex min-h-0 min-w-0 grow">
        <Sidebar
          folders={folders}
          transcriptions={transcriptions}
          query={query}
          selectedId={selectedId}
          expandedFolderIds={expandedFolderIds}
          onToggleFolder={toggleFolder}
          onSelect={selectTranscription}
        />
        {showTranscriptionPane ? (
          <TranscriptionPane folderName={selectedFolderName} detail={paneDetail} loading={detailLoading} />
        ) : null}
        <ChatPane
          variant={showTranscriptionPane ? "sidebar" : "full"}
          chats={chats}
          currentChat={currentChat}
          messages={messages}
          status={status}
          hasTranscription={Boolean(selectedId)}
          showTranscriptionPane={showTranscriptionPane}
          onToggleLayout={togglePane}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          folders={folders}
          transcriptions={transcriptions}
          onSend={handleSend}
          onMentionClick={handleMentionClick}
          onAttachAudio={handleAttachAudio}
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.mp4"
        className="hidden"
        onChange={(event) => {
          void handleAudioChosen(event);
        }}
      />
    </div>
  );
}
