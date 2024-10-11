import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Dashboard.css'; // Import the CSS file

interface ImageData {
  url: string;
  filename: string;
  id: number;
  upload_date: string;
  user_id: number;
}

interface TokenPayload {
  sub: {
    id: number;
    username: string;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [pagelimit, setPagelimit] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [perPage, setPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const decodeToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decodedToken = jwtDecode<TokenPayload>(token);
      setUserId(decodedToken.sub.id);
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    decodeToken();
  }, []);

  useEffect(() => {
    const calculatePerPage = () => {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const rows = Math.floor(windowHeight / (windowHeight / 30));
      const newPerPage = rows * Math.floor(windowWidth / (windowWidth / 30));
      setPerPage(newPerPage);
    };

    calculatePerPage();
    window.addEventListener('resize', calculatePerPage);

    return () => {
      window.removeEventListener('resize', calculatePerPage);
    };
  }, []);

  const fetchImages = async () => {
    if (!userId) return;

    setLoading(true);
    if (page <= pagelimit) {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`/image/images?page=${page}&per_page=${perPage}&user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPagelimit(response.data.pages);
        setImages((prevImages) => [...prevImages, ...response.data.images]);
      } catch (error: any) {
        if (error.status === 401) {
          navigate('/login');
        }
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [page, userId]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.post('/image/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setImages([...response.data.images, ...images]);
    } catch (error: any) {
      if (error.status === 401) {
        navigate('/login');
      }
      console.error('Error uploading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (id: number) => {
    setSelectedImages((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((imageId) => imageId !== id)
        : [...prevSelected, id]
    );
  };

  const handleDeleteImages = async () => {
    if (selectedImages.length === 0) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      setLoading(true);
      await axios.delete('/image/delete_images', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          image_ids: selectedImages,
        },
      });
      setImages((prevImages) => prevImages.filter((image) => !selectedImages.includes(image.id)));
      setSelectedImages([]); 
    } catch (error: any) {
      if (error.status === 401) {
        navigate('/login');
      }
      console.error('Error deleting images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollY + windowHeight >= documentHeight - 50 && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loading]);

  const handleImageClick = async (url: string) => {
    setModalOpen(true);
    setModalLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('/llm/generate-description', { url: url }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setModalData(response.data.description);
    } catch (error: any) {
      if (error.status === 401) {
        navigate('/login');
      }
      console.error('Error fetching image details:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalData(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  return (
    <div style={{ width: '80%', height: '300px', margin: '0 auto' }}>
      <h4>Click image to see description by Chatgpt</h4>
      <div className="image-grid">
        {images.map((image) => (
          <div key={image.id} className="image-item">
            <input
              type="checkbox"
              checked={selectedImages.includes(image.id)}
              onChange={() => handleImageSelect(image.id)}
            />
            <img onClick={() => handleImageClick(image.url)} src={image.url} alt={`S3 Image ${image.filename}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
      {loading && <p>Loading more images...</p>}

      <input
        type="file"
        id="image-upload-input"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
        multiple
      />
      <button
        className="floating-button upload"
        onClick={() => document.getElementById('image-upload-input')?.click()}
      >
        Upload
      </button>
      <button onClick={handleDeleteImages} disabled={selectedImages.length === 0} className="floating-button">
        Delete
      </button>
      <button onClick={handleLogout} className="floating-button-logout">
        Logout
      </button>

      {modalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-modal" onClick={handleModalClose}>
              &times;
            </span>
            {modalLoading ? (
              <div className="loading-container">
                ...
              </div>
            ) : (
              <div>
                {/* Display the modal data here */}
                <h3>Image Description</h3>
                <p>{modalData}</p>
                {/* Add other relevant data */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
