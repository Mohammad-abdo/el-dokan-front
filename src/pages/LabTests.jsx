import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import showToast from "@/lib/toast";
import { showConfirm } from "@/components/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FlaskConical,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

export default function LabTests() {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    duration: "",
    preparation: "",
  });

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      const response = await api.get("/lab-tests");
      setLabTests(response.data.labTests || []);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTest) {
        await api.put(`/lab-tests/${editingTest.id}`, {
          ...formData,
          price: parseFloat(formData.price),
        });
      } else {
        await api.post("/lab-tests", {
          ...formData,
          price: parseFloat(formData.price),
        });
      }
      await fetchLabTests();
      setShowForm(false);
      setEditingTest(null);
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        duration: "",
        preparation: "",
      });
    } catch (error) {
      showToast.error(error.response?.data?.message || "Error saving lab test");
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      description: test.description || "",
      category: test.category || "",
      price: test.price.toString(),
      duration: test.duration || "",
      preparation: test.preparation || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    showConfirm("Are you sure you want to delete this lab test?", async () => {
      try {
        await api.delete(`/lab-tests/${id}`);
        await fetchLabTests();
      } catch (error) {
        showToast.error(error.response?.data?.message || "Error deleting lab test");
      }
    });
  };

  const filteredTests = labTests.filter(
    (test) =>
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lab Tests</h1>
          <p className="text-muted-foreground">
            Manage lab tests and their details
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingTest(null);
            setFormData({
              name: "",
              description: "",
              category: "",
              price: "",
              duration: "",
              preparation: "",
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Lab Test
        </motion.button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {editingTest ? "Edit Lab Test" : "Add New Lab Test"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="e.g., Blood Test, Urine Test"
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      placeholder="e.g., 24 hours, 2-3 days"
                      className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preparation Instructions
                  </label>
                  <textarea
                    value={formData.preparation}
                    onChange={(e) =>
                      setFormData({ ...formData, preparation: e.target.value })
                    }
                    rows={3}
                    placeholder="e.g., Fasting required, No food 12 hours before"
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    {editingTest ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTest(null);
                      setFormData({
                        name: "",
                        description: "",
                        category: "",
                        price: "",
                        duration: "",
                        preparation: "",
                      });
                    }}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search lab tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No lab tests found</p>
              </div>
            ) : (
              filteredTests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FlaskConical className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{test.name}</h3>
                      {test.category && (
                        <p className="text-sm text-muted-foreground">
                          Category: {test.category}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm font-medium">
                          ${test.price.toFixed(2)}
                        </p>
                        {test.duration && (
                          <p className="text-xs text-muted-foreground">
                            Duration: {test.duration}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(test)}
                      className="p-2 rounded-lg hover:bg-accent transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
