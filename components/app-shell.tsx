"use client";

import { ChatPane } from "@/components/chat-pane/chat-pane";
import { Sidebar } from "@/components/sidebar/sidebar";
import { Topbar } from "@/components/topbar/topbar";
import { TranscriptionPane } from "@/components/transcription-pane/transcription-pane";
import { useWorkspace } from "@/hooks/use-workspace";

export function AppShell() {
  const {
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
    composerFocusTick,
    requestComposerFocus,
    selectTranscription,
    openTranscription,
    handleMentionClick,
    toggleFolder,
    togglePane,
    handleNewChat,
    handleCreateFolder,
    handleRenameFolder,
    handleDuplicateFolder,
    handleDeleteFolder,
    handleUpdateTranscription,
    handleDeleteTranscription,
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
      <Topbar
        transcriptions={transcriptions}
        onSelectTranscription={openTranscription}
        onNewChat={handleNewChat}
        onCreateFolder={handleCreateFolder}
      />
      <div className="flex min-h-0 min-w-0 grow">
        <Sidebar
          folders={folders}
          transcriptions={transcriptions}
          selectedId={selectedId}
          expandedFolderIds={expandedFolderIds}
          onToggleFolder={toggleFolder}
          onSelect={selectTranscription}
          onNewChat={handleNewChat}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDuplicateFolder={handleDuplicateFolder}
          onDeleteFolder={handleDeleteFolder}
          onUpdateTranscription={handleUpdateTranscription}
          onDeleteTranscription={handleDeleteTranscription}
        />
        {showTranscriptionPane ? (
          <TranscriptionPane
            folderName={selectedFolderName}
            detail={paneDetail}
            loading={detailLoading}
            onClose={() => {
              if (selectedId) selectTranscription(selectedId);
              requestComposerFocus();
            }}
          />
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
          composerFocusTick={composerFocusTick}
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
