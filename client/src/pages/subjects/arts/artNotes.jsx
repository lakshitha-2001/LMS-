"use client"

import { useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { ArrowLeft, Copy, ExternalLink, BookOpen, User } from "lucide-react"
import axios from "axios"
import { toast } from "react-toastify"

const ArtNotes = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const subjectId = new URLSearchParams(location.search).get("subject")
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLink, setShowLink] = useState({}) // State to track which note's link is visible

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const { data } = await axios.get("http://localhost:5080/api/notes", {
          headers,
        })

        // Filter notes by subject (case-insensitive match)
        const filteredNotes = data.filter((note) => note.subject.toLowerCase() === (subjectId || "").toLowerCase())
        setNotes(filteredNotes)
      } catch (error) {
        console.error("Error fetching notes:", error)
        setError(error.response?.data?.message || "Failed to fetch notes. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (subjectId) fetchNotes()
  }, [subjectId])

  // Handle copying link to clipboard
  const handleCopyLink = (link) => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        toast.success("Link copied to clipboard!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      })
      .catch((err) => {
        console.error("Failed to copy link:", err)
        toast.error("Failed to copy link. Please try again.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      })
  }

  // Toggle link visibility for a specific note
  const toggleShowLink = (noteId) => {
    setShowLink((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <div className="container mx-auto p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-3 px-8 py-4 mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.05] border border-blue-500/20"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform duration-300" />
            <span className="text-lg">Back to Subjects</span>
          </button>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
              {subjectId ? subjectId.charAt(0).toUpperCase() + subjectId.slice(1).toLowerCase() : "Unknown Subject"}{" "}
              Notes
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Access comprehensive study materials and resources for your learning journey
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-600 text-lg">Loading notes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        ) : notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {notes.map((note) => (
              <div
                key={note._id}
                className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/30 group hover:-translate-y-2"
              >
                {/* Note Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-slate-800 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {note.title}
                    </h2>
                    <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-200">
                      <BookOpen className="w-4 h-4 inline-block mr-1" />
                      Note
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">{note.caption}</p>
                  <div className="flex items-center text-slate-600 mb-2">
                    <span className="text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 rounded-full border border-blue-100">
                      Subject: {note.subject.charAt(0).toUpperCase() + note.subject.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Note Link */}
                {note.classroomLink && (
                  <div className="space-y-3 mb-4">
                    <button
                      onClick={() => toggleShowLink(note._id)}
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                      {showLink[note._id] ? "Hide Note Link" : "Get Note Link"}
                    </button>

                    {showLink[note._id] && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                          <span className="text-sm text-slate-700 truncate flex-1 mr-3">{note.classroomLink}</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleCopyLink(note.classroomLink)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Copy Link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <a
                              href={note.classroomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Open Note"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Creator Info */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {note.createdBy?.firstName} {note.createdBy?.lastName || ""}
                    </p>
                    <p className="text-sm text-slate-500">
                      {note.createdBy?.role
                        ? note.createdBy.role.charAt(0).toUpperCase() + note.createdBy.role.slice(1)
                        : "Contributor"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto shadow-lg border border-white/30">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No notes found</h3>
              <p className="text-slate-600 mb-6">There are currently no notes available for {subjectId}.</p>
              <button
                onClick={() => navigate(-1)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-semibold"
              >
                Browse Other Subjects
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArtNotes
