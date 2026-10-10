import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../services/apiClient";

const POLL_INTERVAL = 5000;

const PRIORITY_LABELS = {
  normal: "NORMAL",
  high: "HIGH",
  urgent: "URGENT",
  critical: "CRITICAL",
};

const CATEGORY_LABELS = {
  general: "General",
  driver_not_found: "Driver Not Found",
  vehicle_not_arrived: "Vehicle Not Arrived",
  help: "Help",
  emergency: "Emergency",
};

function getPriorityClass(priority) {
  switch (priority) {
    case "critical":
      return "live-support-priority critical";
    case "urgent":
      return "live-support-priority urgent";
    case "high":
      return "live-support-priority high";
    default:
      return "live-support-priority normal";
  }
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getConversationTransferId(conversation) {
  return (
    conversation?.transfer_id ??
    conversation?.transfer?.id ??
    conversation?.id ??
    null
  );
}

function getConversationReference(conversation) {
  return (
    conversation?.booking_reference ??
    conversation?.booking_ref ??
    conversation?.reference ??
    conversation?.transfer?.booking_reference ??
    conversation?.transfer?.booking_ref ??
    `Transfer #${getConversationTransferId(conversation) ?? "—"}`
  );
}

function getPassengerName(conversation) {
  return (
    conversation?.passenger_name ??
    conversation?.transfer?.passenger_name ??
    conversation?.passenger?.name ??
    "Passenger"
  );
}

function getLastMessage(conversation) {
  const value =
    conversation?.last_message?.message ??
    conversation?.last_message ??
    conversation?.message ??
    "";

  return typeof value === "string" ? value : "";
}

function getUnreadCount(conversation) {
  return Number(
    conversation?.unread_passenger_count ??
      conversation?.unread_count ??
      conversation?.unread ??
      0,
  );
}

function getConversationPriority(conversation) {
  return (
    conversation?.last_message?.priority ??
    conversation?.priority ??
    "normal"
  );
}

function getConversationUpdatedAt(conversation) {
  return (
    conversation?.last_message?.created_at ??
    conversation?.updated_at ??
    conversation?.created_at ??
    null
  );
}

function normalizeConversationList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.conversations)) {
    return payload.conversations;
  }

  if (Array.isArray(payload?.data?.conversations)) {
    return payload.data.conversations;
  }

  return [];
}

function normalizeThread(payload) {
  const root = payload?.data ?? payload ?? {};

  let messages = [];

  if (Array.isArray(root)) {
    messages = root;
  } else if (Array.isArray(root?.messages)) {
    messages = root.messages;
  } else if (Array.isArray(payload?.messages)) {
    messages = payload.messages;
  }

  const transfer =
    root?.transfer ??
    payload?.transfer ??
    null;

  return {
    transfer,
    messages,
  };
}

function MessageBubble({ message }) {
  const isOperation =
    message?.sender_type === "operation" ||
    message?.sender_type === "admin" ||
    message?.sender_type === "dispatcher";

  const priority = message?.priority || "normal";
  const category = message?.category || "general";

  return (
    <div
      className={
        isOperation
          ? "live-support-message-row operation"
          : "live-support-message-row passenger"
      }
    >
      <div className="live-support-message-bubble">
        <div className="live-support-message-meta">
          <strong>
            {isOperation ? "Skyfleet Operations" : "Passenger"}
          </strong>

          <span>{formatDateTime(message?.created_at)}</span>
        </div>

        <p>{message?.message || "—"}</p>

        <div className="live-support-message-tags">
          <span className={getPriorityClass(priority)}>
            {PRIORITY_LABELS[priority] || priority.toUpperCase()}
          </span>

          <span className="live-support-category">
            {CATEGORY_LABELS[category] || category}
          </span>

          {message?.original_language && (
            <span className="live-support-language">
              {String(message.original_language).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveSupportPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);

  const [reply, setReply] = useState("");
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const selectedTransferIdRef = useRef(null);

  useEffect(() => {
    selectedTransferIdRef.current = selectedTransferId;
  }, [selectedTransferId]);

  const loadConversations = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingConversations(true);
    }

    try {
      const response = await apiClient.get("/admin/support");

      const list = normalizeConversationList(response.data);

      setConversations(list);
      setError("");

      const currentSelectedId = selectedTransferIdRef.current;

      if (!currentSelectedId && list.length > 0) {
        const firstTransferId = getConversationTransferId(list[0]);

        if (firstTransferId) {
          setSelectedTransferId(firstTransferId);
        }
      }
    } catch (requestError) {
      console.error("Live support conversations could not be loaded.", requestError);

      if (!silent) {
        setError(
          requestError?.response?.data?.message ||
            "Live support conversations could not be loaded.",
        );
      }
    } finally {
      if (!silent) {
        setLoadingConversations(false);
      }
    }
  }, []);

  const loadThread = useCallback(
    async (transferId, { silent = false } = {}) => {
      if (!transferId) {
        return;
      }

      if (!silent) {
        setLoadingThread(true);
      }

      try {
        const response = await apiClient.get(
          `/admin/support/${encodeURIComponent(transferId)}`,
        );

        const thread = normalizeThread(response.data);

        setSelectedTransfer(thread.transfer);
        setMessages(thread.messages);
        setError("");

        setConversations((current) =>
          current.map((conversation) => {
            if (
              String(getConversationTransferId(conversation)) !==
              String(transferId)
            ) {
              return conversation;
            }

            return {
              ...conversation,
              unread_passenger_count: 0,
              unread_count: 0,
              unread: 0,
            };
          }),
        );
      } catch (requestError) {
        console.error("Live support conversation could not be loaded.", requestError);

        if (!silent) {
          setError(
            requestError?.response?.data?.message ||
              "The selected conversation could not be loaded.",
          );
        }
      } finally {
        if (!silent) {
          setLoadingThread(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadConversations();

    const timer = window.setInterval(() => {
      loadConversations({ silent: true });
    }, POLL_INTERVAL);

    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedTransferId) {
      setSelectedTransfer(null);
      setMessages([]);
      return undefined;
    }

    loadThread(selectedTransferId);

    const timer = window.setInterval(() => {
      loadThread(selectedTransferId, { silent: true });
    }, POLL_INTERVAL);

    return () => window.clearInterval(timer);
  }, [selectedTransferId, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          String(getConversationTransferId(conversation)) ===
          String(selectedTransferId),
      ) ?? null,
    [conversations, selectedTransferId],
  );

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) =>
          total + getUnreadCount(conversation),
        0,
      ),
    [conversations],
  );

  async function handleSendReply(event) {
    event.preventDefault();

    const message = reply.trim();

    if (!selectedTransferId || !message || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      await apiClient.post(
        `/admin/support/${encodeURIComponent(
          selectedTransferId,
        )}/messages`,
        {
          message,
          category: "general",
        },
      );

      setReply("");

      await loadThread(selectedTransferId, {
        silent: true,
      });

      await loadConversations({
        silent: true,
      });
    } catch (requestError) {
      console.error("Operation reply could not be sent.", requestError);

      setError(
        requestError?.response?.data?.message ||
          "The reply could not be sent.",
      );
    } finally {
      setSending(false);
    }
  }

  const headerReference =
    selectedTransfer?.booking_reference ??
    selectedTransfer?.booking_ref ??
    selectedConversation
      ? getConversationReference(
          selectedTransfer || selectedConversation,
        )
      : "Live Support";

  const headerPassenger =
    selectedTransfer?.passenger_name ??
    (selectedConversation
      ? getPassengerName(selectedConversation)
      : "Passenger");

  return (
    <div className="live-support-page">
      <div className="live-support-page-header">
        <div>
          <span className="live-support-eyebrow">
            PASSENGER COMMUNICATION
          </span>

          <h1>Live Support</h1>

          <p>
            Manage passenger messages and operational assistance
            from active journeys.
          </p>
        </div>

        <div className="live-support-header-stats">
          <div>
            <strong>{conversations.length}</strong>
            <span>Conversations</span>
          </div>

          <div>
            <strong>{totalUnread}</strong>
            <span>Unread</span>
          </div>

          <div className="live-support-online">
            <span className="live-support-online-dot" />
            LIVE
          </div>
        </div>
      </div>

      {error && (
        <div className="live-support-error">
          {error}
        </div>
      )}

      <div className="live-support-workspace">
        <aside className="live-support-conversations">
          <div className="live-support-panel-heading">
            <div>
              <span>INBOX</span>
              <h2>Passenger Conversations</h2>
            </div>

            {totalUnread > 0 && (
              <span className="live-support-unread-total">
                {totalUnread}
              </span>
            )}
          </div>

          <div className="live-support-conversation-list">
            {loadingConversations ? (
              <div className="live-support-empty">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="live-support-empty">
                <strong>No passenger messages</strong>
                <span>
                  New passenger support requests will appear here.
                </span>
              </div>
            ) : (
              conversations.map((conversation) => {
                const transferId =
                  getConversationTransferId(conversation);

                const unread =
                  getUnreadCount(conversation);

                const priority =
                  getConversationPriority(conversation);

                const active =
                  String(transferId) ===
                  String(selectedTransferId);

                return (
                  <button
                    key={
                      transferId ??
                      getConversationReference(conversation)
                    }
                    type="button"
                    className={
                      active
                        ? "live-support-conversation active"
                        : "live-support-conversation"
                    }
                    onClick={() =>
                      setSelectedTransferId(transferId)
                    }
                  >
                    <div className="live-support-conversation-top">
                      <strong>
                        {getPassengerName(conversation)}
                      </strong>

                      <span>
                        {formatDateTime(
                          getConversationUpdatedAt(conversation),
                        )}
                      </span>
                    </div>

                    <div className="live-support-conversation-reference">
                      {getConversationReference(conversation)}
                    </div>

                    <p>
                      {getLastMessage(conversation) ||
                        "Passenger support conversation"}
                    </p>

                    <div className="live-support-conversation-footer">
                      <span className={getPriorityClass(priority)}>
                        {PRIORITY_LABELS[priority] ||
                          String(priority).toUpperCase()}
                      </span>

                      {unread > 0 && (
                        <span className="live-support-unread-badge">
                          {unread}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="live-support-thread">
          {!selectedTransferId ? (
            <div className="live-support-no-selection">
              <div className="live-support-no-selection-icon">
                💬
              </div>

              <h2>Select a conversation</h2>

              <p>
                Passenger messages will appear here for the
                operations team.
              </p>
            </div>
          ) : (
            <>
              <header className="live-support-thread-header">
                <div>
                  <span>ACTIVE CONVERSATION</span>

                  <h2>{headerPassenger}</h2>

                  <p>{headerReference}</p>
                </div>

                {selectedConversation && (
                  <div
                    className={getPriorityClass(
                      getConversationPriority(
                        selectedConversation,
                      ),
                    )}
                  >
                    {PRIORITY_LABELS[
                      getConversationPriority(
                        selectedConversation,
                      )
                    ] ||
                      getConversationPriority(
                        selectedConversation,
                      ).toUpperCase()}
                  </div>
                )}
              </header>

              <div className="live-support-thread-messages">
                {loadingThread ? (
                  <div className="live-support-empty">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="live-support-empty">
                    No messages in this conversation.
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={
                        message?.id ??
                        `${message?.sender_type}-${message?.created_at}`
                      }
                      message={message}
                    />
                  ))
                )}

                <div ref={messagesEndRef} />
              </div>

              <form
                className="live-support-reply"
                onSubmit={handleSendReply}
              >
                <div className="live-support-reply-heading">
                  <strong>Reply as Skyfleet Operations</strong>

                  <span>
                    Passenger will see this message in Live Support.
                  </span>
                </div>

                <div className="live-support-reply-controls">
                  <textarea
                    value={reply}
                    onChange={(event) =>
                      setReply(event.target.value)
                    }
                    placeholder="Write your reply to the passenger..."
                    rows={3}
                    maxLength={2000}
                    disabled={sending}
                  />

                  <button
                    type="submit"
                    disabled={
                      sending ||
                      !reply.trim() ||
                      !selectedTransferId
                    }
                  >
                    {sending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      <style>{`
        .live-support-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: calc(100vh - 110px);
        }

        .live-support-page-header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
        }

        .live-support-eyebrow,
        .live-support-panel-heading span,
        .live-support-thread-header > div > span {
          display: block;
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #6f8096;
        }

        .live-support-page-header h1 {
          margin: 0;
          font-size: 30px;
        }

        .live-support-page-header p {
          margin: 8px 0 0;
          color: #758399;
        }

        .live-support-header-stats {
          display: flex;
          gap: 12px;
          align-items: stretch;
        }

        .live-support-header-stats > div {
          min-width: 105px;
          padding: 12px 16px;
          border: 1px solid rgba(127, 145, 170, 0.18);
          border-radius: 14px;
          background: rgba(255,255,255,0.035);
        }

        .live-support-header-stats strong,
        .live-support-header-stats span {
          display: block;
        }

        .live-support-header-stats strong {
          font-size: 20px;
        }

        .live-support-header-stats span {
          margin-top: 3px;
          font-size: 11px;
          color: #7f8ca0;
        }

        .live-support-header-stats .live-support-online {
          min-width: auto;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 800;
          color: #32c985;
        }

        .live-support-online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 12px currentColor;
        }

        .live-support-error {
          padding: 12px 15px;
          border: 1px solid rgba(238, 87, 87, 0.35);
          border-radius: 12px;
          background: rgba(238, 87, 87, 0.08);
          color: #e76b6b;
          font-size: 13px;
        }

        .live-support-workspace {
          display: grid;
          grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
          flex: 1;
          min-height: 640px;
          overflow: hidden;
          border: 1px solid rgba(127, 145, 170, 0.16);
          border-radius: 18px;
          background: rgba(255,255,255,0.025);
        }

        .live-support-conversations {
          display: flex;
          flex-direction: column;
          min-width: 0;
          border-right: 1px solid rgba(127, 145, 170, 0.16);
        }

        .live-support-panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(127, 145, 170, 0.13);
        }

        .live-support-panel-heading h2 {
          margin: 0;
          font-size: 16px;
        }

        .live-support-unread-total,
        .live-support-unread-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          padding: 0 7px;
          border-radius: 999px;
          background: #2bbcff;
          color: white;
          font-size: 11px;
          font-weight: 800;
        }

        .live-support-conversation-list {
          overflow-y: auto;
          flex: 1;
        }

        .live-support-conversation {
          width: 100%;
          padding: 17px 18px;
          border: 0;
          border-bottom: 1px solid rgba(127, 145, 170, 0.1);
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: background 0.18s ease;
        }

        .live-support-conversation:hover,
        .live-support-conversation.active {
          background: rgba(43, 188, 255, 0.075);
        }

        .live-support-conversation.active {
          box-shadow: inset 3px 0 #2bbcff;
        }

        .live-support-conversation-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .live-support-conversation-top strong {
          font-size: 14px;
        }

        .live-support-conversation-top > span {
          font-size: 10px;
          color: #7d899b;
          white-space: nowrap;
        }

        .live-support-conversation-reference {
          margin-top: 5px;
          color: #2bbcff;
          font-size: 11px;
          font-weight: 700;
        }

        .live-support-conversation p {
          margin: 9px 0;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          color: #8b97a9;
          font-size: 12px;
          line-height: 1.45;
        }

        .live-support-conversation-footer,
        .live-support-message-tags {
          display: flex;
          gap: 7px;
          align-items: center;
          flex-wrap: wrap;
        }

        .live-support-conversation-footer {
          justify-content: space-between;
        }

        .live-support-priority,
        .live-support-category,
        .live-support-language {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          padding: 0 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .live-support-priority.normal {
          background: rgba(114, 132, 153, 0.13);
          color: #8997a9;
        }

        .live-support-priority.high {
          background: rgba(245, 170, 56, 0.14);
          color: #e8a43e;
        }

        .live-support-priority.urgent {
          background: rgba(239, 111, 60, 0.15);
          color: #ef7b4c;
        }

        .live-support-priority.critical {
          background: rgba(238, 75, 75, 0.15);
          color: #ee6262;
        }

        .live-support-category,
        .live-support-language {
          background: rgba(43, 188, 255, 0.09);
          color: #62c8f5;
        }

        .live-support-thread {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .live-support-thread-header {
          min-height: 78px;
          padding: 17px 22px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          border-bottom: 1px solid rgba(127, 145, 170, 0.13);
        }

        .live-support-thread-header h2 {
          margin: 0;
          font-size: 17px;
        }

        .live-support-thread-header p {
          margin: 4px 0 0;
          color: #2bbcff;
          font-size: 11px;
          font-weight: 700;
        }

        .live-support-thread-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: rgba(0, 0, 0, 0.04);
        }

        .live-support-message-row {
          display: flex;
          margin-bottom: 16px;
        }

        .live-support-message-row.passenger {
          justify-content: flex-start;
        }

        .live-support-message-row.operation {
          justify-content: flex-end;
        }

        .live-support-message-bubble {
          width: min(76%, 680px);
          padding: 14px 16px;
          border: 1px solid rgba(127, 145, 170, 0.15);
          border-radius: 16px;
          background: rgba(255,255,255,0.045);
        }

        .live-support-message-row.operation .live-support-message-bubble {
          border-color: rgba(43, 188, 255, 0.24);
          background: rgba(43, 188, 255, 0.09);
        }

        .live-support-message-meta {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
        }

        .live-support-message-meta strong {
          font-size: 11px;
        }

        .live-support-message-meta span {
          color: #78869a;
          font-size: 10px;
        }

        .live-support-message-bubble p {
          margin: 10px 0 12px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.55;
          font-size: 13px;
        }

        .live-support-reply {
          padding: 18px 20px;
          border-top: 1px solid rgba(127, 145, 170, 0.13);
        }

        .live-support-reply-heading {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .live-support-reply-heading strong {
          font-size: 12px;
        }

        .live-support-reply-heading span {
          color: #7d899b;
          font-size: 10px;
        }

        .live-support-reply-controls {
          display: flex;
          gap: 12px;
          align-items: stretch;
        }

        .live-support-reply textarea {
          flex: 1;
          resize: none;
          min-height: 76px;
          padding: 12px 14px;
          border: 1px solid rgba(127, 145, 170, 0.2);
          border-radius: 12px;
          background: rgba(0,0,0,0.08);
          color: inherit;
          font: inherit;
          font-size: 13px;
          outline: none;
        }

        .live-support-reply textarea:focus {
          border-color: rgba(43, 188, 255, 0.65);
          box-shadow: 0 0 0 3px rgba(43, 188, 255, 0.08);
        }

        .live-support-reply button {
          min-width: 125px;
          padding: 0 18px;
          border: 0;
          border-radius: 12px;
          background: #2bbcff;
          color: white;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .live-support-reply button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .live-support-empty,
        .live-support-no-selection {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 180px;
          padding: 30px;
          text-align: center;
          color: #7d899b;
          font-size: 12px;
        }

        .live-support-no-selection {
          flex: 1;
        }

        .live-support-no-selection-icon {
          font-size: 34px;
        }

        .live-support-no-selection h2 {
          margin: 5px 0 0;
          color: inherit;
          font-size: 18px;
        }

        .live-support-no-selection p {
          margin: 0;
        }

        @media (max-width: 1000px) {
          .live-support-page-header {
            flex-direction: column;
          }

          .live-support-workspace {
            grid-template-columns: 300px minmax(0, 1fr);
          }
        }

        @media (max-width: 760px) {
          .live-support-header-stats {
            width: 100%;
            flex-wrap: wrap;
          }

          .live-support-workspace {
            display: flex;
            flex-direction: column;
          }

          .live-support-conversations {
            max-height: 330px;
            border-right: 0;
            border-bottom: 1px solid rgba(127, 145, 170, 0.16);
          }

          .live-support-thread {
            min-height: 600px;
          }

          .live-support-message-bubble {
            width: 90%;
          }

          .live-support-reply-controls {
            flex-direction: column;
          }

          .live-support-reply button {
            min-height: 46px;
          }
        }
      `}</style>
    </div>
  );
}